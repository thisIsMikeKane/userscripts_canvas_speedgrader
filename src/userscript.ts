export default {
    id: "userscript-canvas-speedgrader",
    name: "Canvas SpeedGrader Userscript",
    version: "0.1.0",
    description: "Canvas SpeedGrader Hotkeys and ChatGPT Integration with AssistantAdds hotkeys to Canvas SpeedGrader, integrates ChatGPT API for content extraction with a specific assistant, and parses evaluation response schema from ChatGPT response for grading automation with proper assistant creation and improved error handling. Now includes fetching messages after run completion and a defined sendToChatGPT function to fix ReferenceError. Updates grade and comment fields correctly in the main document.",
    author: "Michael Kane",
    namespace: "thisismikekane.com",
    hostname: "instructure.com",
    sitename: "instructure.com",
    match: ["https://*.instructure.com/courses/*/gradebook/speed_grader*"],
    grant: ["GM.setValue", "GM.getValue"],
    runAt: "document-idle",
} as const;
