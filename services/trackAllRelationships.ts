/** @format */

import {
	extractTableName,
	loadYamlMetadata,
	makeHasuraRequest,
} from '../helpers/helpers';
import pluralize from 'pluralize';

export async function trackAllRelationships(
	hasuraUrl: string,
	hasuraAdminSecret: string,
	filePath: string
) {
	const metadata = loadYamlMetadata(filePath);
	const sourceName = metadata.sources[0].name;

	// Fetch tracked tables
	const tablesResponse = await makeHasuraRequest(
		hasuraUrl,
		hasuraAdminSecret,
		'/v1/metadata',
		{
			type: 'export_metadata',
			args: {},
		}
	);

	const sourceData = tablesResponse.sources.find(
		(s: any) => s.name === sourceName
	);
	const tables = sourceData?.tables.map((t: any) => t.table.name) || [];

	if (tables.length === 0) {
		console.log('No tables found to track relationships.');
		return;
	}

	// Get existing relationships to avoid conflicts
	const existingRelationships = new Map<string, Set<string>>();
	sourceData?.tables.forEach((table: any) => {
		const tableName = table.table.name;
		const relationships = new Set<string>();

		// Collect object relationships
		table.object_relationships?.forEach((rel: any) => {
			relationships.add(rel.name);
		});

		// Collect array relationships
		table.array_relationships?.forEach((rel: any) => {
			relationships.add(rel.name);
		});

		if (relationships.size > 0) {
			existingRelationships.set(tableName, relationships);
			console.log(
				`Found existing relationships for ${tableName}:`,
				Array.from(relationships)
			);
		}
	});

	// Fetch foreign key constraints
	const fkQuery = `
      SELECT
        conrelid::regclass AS table_name,
        a.attname AS column_name,
        confrelid::regclass AS referenced_table,
        af.attname AS referenced_column
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
      WHERE c.contype = 'f';
    `;

	const fkResponse = await makeHasuraRequest(
		hasuraUrl,
		hasuraAdminSecret,
		'/v2/query',
		{
			type: 'run_sql',
			args: { source: sourceName, sql: fkQuery },
		}
	);

	// Ignore column headers
	const relationships = fkResponse.result.slice(1);

	// Track used relationship names to detect duplicates
	const usedObjectRelationshipNames = new Map<string, Set<string>>();
	const usedArrayRelationshipNames = new Map<string, Set<string>>();

	// Helper function to get or create set for table
	function getObjectRelationshipSet(tableName: string): Set<string> {
		if (!usedObjectRelationshipNames.has(tableName)) {
			// Initialize with existing relationships to avoid conflicts
			const existing =
				existingRelationships.get(tableName) || new Set<string>();
			usedObjectRelationshipNames.set(tableName, new Set(existing));
		}
		return usedObjectRelationshipNames.get(tableName)!;
	}

	function getArrayRelationshipSet(tableName: string): Set<string> {
		if (!usedArrayRelationshipNames.has(tableName)) {
			// Initialize with existing relationships to avoid conflicts
			const existing =
				existingRelationships.get(tableName) || new Set<string>();
			usedArrayRelationshipNames.set(tableName, new Set(existing));
		}
		return usedArrayRelationshipNames.get(tableName)!;
	}

	// Helper function to generate unique relationship name
	function getUniqueObjectRelationshipName(
		cleanTable: string,
		cleanRefTable: string,
		column: string
	): string {
		const usedNames = getObjectRelationshipSet(cleanTable);
		const singularRefTable = pluralize.singular(cleanRefTable);

		// First try the default name
		if (!usedNames.has(singularRefTable)) {
			usedNames.add(singularRefTable);
			return singularRefTable;
		}

		// If duplicate, create name from column (remove _id suffix if present)
		let columnBasedName = column.replace(/_id$/, '');

		// Ensure uniqueness even for column-based names
		let finalName = columnBasedName;
		let counter = 1;
		while (usedNames.has(finalName)) {
			finalName = `${columnBasedName}_${counter}`;
			counter++;
		}

		usedNames.add(finalName);
		return finalName;
	}

	function getUniqueArrayRelationshipName(
		cleanTable: string,
		cleanRefTable: string,
		column: string
	): string {
		const usedNames = getArrayRelationshipSet(cleanRefTable);
		const pluralTable = pluralize.plural(cleanTable);

		// First try the default name
		if (!usedNames.has(pluralTable)) {
			usedNames.add(pluralTable);
			return pluralTable;
		}

		// If duplicate, create name from column and table
		let columnBasedName = column.replace(/_id$/, '');
		let finalName = `${pluralTable}_by_${columnBasedName}`;

		// Ensure uniqueness even for column-based names
		let counter = 1;
		while (usedNames.has(finalName)) {
			finalName = `${pluralTable}_by_${columnBasedName}_${counter}`;
			counter++;
		}

		usedNames.add(finalName);
		return finalName;
	}

	for (const [table, column, refTable] of relationships) {
		// Extract clean table names
		const cleanTable = extractTableName(table);
		const cleanRefTable = extractTableName(refTable);

		// Check if tables are tracked
		if (!tables.includes(cleanTable) || !tables.includes(cleanRefTable))
			continue;

		// Get unique relationship names
		const objectRelationshipName = getUniqueObjectRelationshipName(
			cleanTable,
			cleanRefTable,
			column
		);
		const arrayRelationshipName = getUniqueArrayRelationshipName(
			cleanTable,
			cleanRefTable,
			column
		);

		console.log(`Processing ${cleanTable}.${column} -> ${cleanRefTable}`);
		console.log(
			`Generated names: object="${objectRelationshipName}", array="${arrayRelationshipName}"`
		);

		// Skip if relationship already exists
		if (existingRelationships.get(cleanTable)?.has(objectRelationshipName)) {
			console.log(
				`Object relationship already exists: ${cleanTable}.${objectRelationshipName} - skipping`
			);
		} else {
			try {
				// Track object relationship
				await makeHasuraRequest(hasuraUrl, hasuraAdminSecret, '/v1/metadata', {
					type: 'pg_create_object_relationship',
					args: {
						source: sourceName,
						table: { schema: metadata.schema, name: cleanTable },
						name: objectRelationshipName,
						using: { foreign_key_constraint_on: column },
					},
				});
				console.log(
					`Object relationship tracked: ${cleanTable} -> ${objectRelationshipName}`
				);
			} catch (error: any) {
				console.log(
					`Failed to create object relationship ${cleanTable}.${objectRelationshipName}:`,
					error.message
				);
				if (error.message?.includes('already exists')) {
					console.log(
						`Relationship ${objectRelationshipName} already exists, continuing...`
					);
				}
			}
		}

		// Skip if relationship already exists
		if (existingRelationships.get(cleanRefTable)?.has(arrayRelationshipName)) {
			console.log(
				`Array relationship already exists: ${cleanRefTable}.${arrayRelationshipName} - skipping`
			);
		} else {
			try {
				// Track array relationship
				await makeHasuraRequest(hasuraUrl, hasuraAdminSecret, '/v1/metadata', {
					type: 'pg_create_array_relationship',
					args: {
						source: sourceName,
						table: { schema: metadata.schema, name: cleanRefTable },
						name: arrayRelationshipName,
						using: {
							foreign_key_constraint_on: {
								table: { schema: metadata.schema, name: cleanTable },
								column,
							},
						},
					},
				});
				console.log(
					`Array relationship tracked: ${cleanRefTable} -> ${arrayRelationshipName}`
				);
			} catch (error: any) {
				console.log(
					`Failed to create array relationship ${cleanRefTable}.${arrayRelationshipName}:`,
					error.message
				);
				if (error.message?.includes('already exists')) {
					console.log(
						`Relationship ${arrayRelationshipName} already exists, continuing...`
					);
				}
			}
		}
	}
}
