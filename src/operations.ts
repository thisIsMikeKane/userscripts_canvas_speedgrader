import { Operation, operation } from "userscripter/run-time/operations";
import { ALWAYS } from "userscripter/run-time/environment";
import { triggerRubricSubmit, toggleRubric } from "./site";
import { parseRubricTable } from "./rubric";    
import { gradeSubmission } from "./grade_submission";

const OPERATIONS: ReadonlyArray<Operation<any>> = [
    operation({
        description: "Trigger the submit button on 'S' keypress",
        condition: ALWAYS,  // This can be updated if you want to add a specific condition
        action: () => {
            document.addEventListener("keydown", (event) => {
                if (event.key.toLowerCase() === "s") {
                    console.debug("Key pressed:", event.key, " Triggering submit button...");
                    triggerRubricSubmit();
                }
            });
        },
    }),
    operation({
        description: "Extract content from iframe and send to ChatGPT on 'C' keypress",
        condition: ALWAYS,  // This can be updated if needed
        action: () => {
            document.addEventListener("keydown", (event) => {
                if (event.key.toLowerCase() === "c") {
                    console.debug("Key pressed:", event.key, " Passing content to ChatGPT...");
                    gradeSubmission();
                }
            });
        },
    }),
    operation({
        description: "Parse rubric table",
        condition: ALWAYS,
        action: () => {
            document.addEventListener("keydown", (event) => {
                if (event.key.toLowerCase() === "j") {
                    console.debug("Key pressed:", event.key, " Extracting rubric table...");
                    const rubricDiv = document.querySelector("div.react-rubric");
                    if (!rubricDiv) {
                        toggleRubric();
                    }
                    if (rubricDiv) {
                        const table = rubricDiv.querySelector("table");
                        if (table) {
                            const htmlString = table.outerHTML;
                            const rubric = parseRubricTable(htmlString);
                            console.log(JSON.stringify(rubric, null, 2));
                        } else {
                            console.log("No table found within the rubric div.");
                        }
                    } else {
                        console.log("No rubric div found.");
                    }
                }
            });
        },
    }),
    operation({
        description: "Check for grading status on page load",
        condition: ALWAYS,
        action: () => {
            window.addEventListener("load", () => {
                const gradingStatusIcon = document.querySelector("span.ui-selectmenu-status>span.speedgrader-selectmenu-icon>i.icon-check");
                if (!gradingStatusIcon) {
                    console.log("Please grade this assignment");
                }
            });
        },
    }),
];

export default OPERATIONS;
