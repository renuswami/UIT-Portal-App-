import { salesforceApi } from './src/api/salesforce.api';

async function discoverFields() {
    console.log('Discovering Account fields...');
    try {
        const query = "SELECT QualifiedApiName FROM FieldDefinition WHERE EntityDefinitionId = 'Account' AND (QualifiedApiName LIKE '%Leave%' OR QualifiedApiName LIKE '%Sick%' OR QualifiedApiName LIKE '%Casual%' OR QualifiedApiName LIKE '%Balance%')";
        const res = await salesforceApi.query(query);
        console.log('Metadata Query Results:');
        console.log(JSON.stringify(res.records, null, 2));
    } catch (error) {
        console.error('Metadata Query Failed:', error);
    }
}

discoverFields();
