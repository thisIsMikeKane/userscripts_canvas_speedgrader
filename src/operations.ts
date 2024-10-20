import { Operation, operation } from "userscripter/run-time/operations";
import { ALWAYS } from "userscripter/run-time/environment";
import { triggerSubmit, extractContentFromIframe } from "./site";
import { sendToChatGPT } from "./preferences";

const OPERATIONS: ReadonlyArray<Operation<any>> = [
    operation({
        description: "Trigger the submit button on 'S' keypress",
        condition: ALWAYS,  // This can be updated if you want to add a specific condition
        action: () => {
            document.addEventListener("keydown", (event) => {
                console.debug("Key pressed:", event.key);
                if (event.key.toLowerCase() === "s") {
                    triggerSubmit();
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
                    console.debug("Key pressed:", event.key);
                    const extractedText = extractContentFromIframe();
                    if (extractedText) {
                        console.log("Extracted Text:", extractedText);
                        sendToChatGPT(extractedText);
                    } else {
                        console.log("No text to send to ChatGPT.");
                    }
                }
            });
        },
    }),
];

export default OPERATIONS;
