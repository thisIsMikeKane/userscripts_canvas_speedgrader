import { extractContentFromIframe } from "./site";
import { sendToChatGPT } from "./api";
import { populateGradeFields, nextSubmission, triggerRubricSubmit } from "./site";

export function gradeSubmission() {
    const extractedText = extractContentFromIframe();
    if (extractedText) {
        console.log("Extracted Text:", extractedText);
        //TODO have sendToChatGPT return response to be graded on the next line
        sendToChatGPT(extractedText);
    } else {
        console.log("No text to send to ChatGPT.");
    }
}

//TODO specify the responseText type
export function parseEvaluationResponse(responseText: any): void {
    try {
      const evaluation = JSON.parse(responseText.value) as Evaluation;
      if (evaluation && evaluation.grade && evaluation.comments && evaluation.rubric) {
        console.log("Parsed Evaluation:", evaluation);
        populateGradeFields(evaluation);

        // Move to the next submission
        //TODO offer user chance to opt-out
        // nextSubmission();

      } else {
        console.error("Invalid response format:", responseText);
      }
    } catch (error) {
      console.error("Failed to parse response as JSON:", error);
    }
}

export interface Evaluation {
    grade: string;
    comments: string;
    rubric: string;
}

