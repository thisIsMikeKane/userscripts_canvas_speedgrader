interface JSONSchema {
    $schema: string;
    type: string;
    properties: {
        [key: string]: any;
    };
    required: string[];
}

interface RubricSchemaWrapper {
    name: string;
    // strict: boolean;
    schema: JSONSchema;
}

export function parseRubricTable(htmlString: string): RubricSchemaWrapper {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Get the title
    const titleElement = doc.querySelector('table > caption > span');
    const title = titleElement?.textContent?.trim() ?? '';

    // Initialize the JSON Schema object
    const schema: JSONSchema = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {},
        required: []
    };

    // Add grade to the schema
    schema.properties['grade'] = {
        type: "number",
        minimum: 0,
        //TODO Update maximum to match the rubric
        maximum: 10,
        description: "Grade as determined by rubric."
    };
    schema.required.push('grade');

    // Add comments to the schema
    schema.properties['comments'] = {
        type: "string",
        description: "Brief comment with specific thing in their response that supports their grade."
    };
    schema.required.push('comments');

    // Add rubric to schema
    schema.properties['rubric'] = {
        type: "object",
        properties: {},
        required: []
    };
    schema.required.push('rubric');

    // Get all the criteria rows
    const criteriaRows = doc.querySelectorAll('table > tbody > tr[data-testid="rubric-criterion"]');

    criteriaRows.forEach(tr => {
        // Get the name of the criterion
        const nameElement = tr.querySelector('th > div.description > span');
        const name = nameElement?.textContent?.trim() ?? '';

        // Sanitize the name to use as a property key
        const propertyName = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

        // Initialize arrays to store points and descriptions
        const optionsArray: string[] = [];

        // Get the options
        const optionElements = tr.querySelectorAll('td > div > span > span > div.rating-tier');

        optionElements.forEach(optionEl => {
            const pointsEl = optionEl.querySelector('div.rating-points > span');
            const pointsText = pointsEl?.textContent?.trim() ?? '';
            const pointsMatch = pointsText.match(/([0-9.]+) pts/);
            const points = pointsMatch ? pointsMatch[1] : '';

            const descriptionEl = optionEl.querySelector('div.rating-description > span');
            const description = descriptionEl?.textContent?.trim() ?? '';

            // Combine points and description for the enum
            const optionValue = `${points} points - ${description}`;
            optionsArray.push(optionValue);
        });

        // Add to the schema
        schema.properties['rubric'].properties[propertyName] = {
            type: "string",
            enum: optionsArray,
            description: name
        };

        schema.properties['rubric'].required.push(propertyName);
    });

    // Wrap the schema in the desired object
    const rubricSchemaWrapper: RubricSchemaWrapper = {
        name: "userscript_canvas_rubric_schema",
        // strict: true, // Assuming you want strict validation
        schema: schema
    };

    return rubricSchemaWrapper;
}

export function selectRubricOptions(responseMessage: any): void {
    // Ensure responseMessage and responseMessage.rubric exist
    if (!responseMessage || !responseMessage.rubric) {
        console.error('Invalid response message');
        return;
    }

    // Get all the criteria rows
    const criteriaRows = document.querySelectorAll('table > tbody > tr[data-testid="rubric-criterion"]');

    let foundOption = false;

    criteriaRows.forEach(tr => {
        // Get the name of the criterion
        const nameElement = tr.querySelector('th > div.description > span');
        const name = nameElement?.textContent?.trim() ?? '';

        // Sanitize the name to use as a property key
        const propertyName = name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

        // Get the selected value from responseMessage.rubric
        const selectedValue = responseMessage.rubric[propertyName];

        if (selectedValue) {
            // In the row tr, find the option that matches selectedValue

            // Get all the options in this criterion
            const optionElements = tr.querySelectorAll('td > div > span > span > div.rating-tier');

            foundOption = false;

            for (let i = 0; i < optionElements.length; i++) {
                const optionEl = optionElements[i];
                // For each option, get the value to compare with selectedValue

                const pointsEl = optionEl.querySelector('div.rating-points > span');
                const pointsText = pointsEl?.textContent?.trim() ?? '';
                const pointsMatch = pointsText.match(/([0-9.]+) pts/);
                const points = pointsMatch ? pointsMatch[1] : '';

                const descriptionEl = optionEl.querySelector('div.rating-description > span');
                const description = descriptionEl?.textContent?.trim() ?? '';

                // Combine points and description for comparison
                const optionValue = `${points} points - ${description}`;

                if (optionValue === selectedValue) {
                    // Found the matching option
                    // Now click the button
                    console.log(`Clicking option "${selectedValue}" for criterion "${name}"`);
                    foundOption = true;
                    (pointsEl as HTMLElement).click();
                    if (foundOption == true) {
                        console.log(`Option "${selectedValue}" clicked for criterion "${name}"`);
                    }
                    break;
                    //TODO get rid of break and check to make sure no duplicates
                }
            }

            if (foundOption == false) {
                console.warn(`Option "${selectedValue}" not found for criterion "${name}"`);
            }
            
        } else {
            console.warn(`No selected value for criterion "${name}"`);
        }
    });
}
