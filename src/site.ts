// This file cannot contain Webpack-resolved imports (e.g. "~src/foo").

import U from "./userscript";
import { Evaluation } from "./grade_submission";
import { selectRubricOptions } from "./rubric";

export const NAME = U.sitename;
export const HOSTNAME = U.hostname;

export function triggerSubmit(): void {
  const submitButton = document.querySelector(".save_rubric_button") as HTMLElement;
  if (submitButton) {
    submitButton.click();
    console.log("Submit button clicked!");
  } else {
    console.log("Submit button not found!");
  }
}
  
export function extractContentFromIframe(): string | null {
  const iframe = document.querySelector("#speedgrader_iframe") as HTMLIFrameElement;
  if (iframe) {
    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
    const contentElement = iframeDocument?.querySelector("div#content.ic-Layout-contentMain");
    if (contentElement) {
      return contentElement.textContent?.trim() || null;
    } else {
      console.log("Content element not found inside iframe!");
      return null;
    }
  } else {
    console.log("Iframe not found!");
    return null;
  }
}
  
export function populateGradeFields(evaluation: Evaluation): void {

  const gradeInput = document.querySelector("#grading-box-extended") as HTMLInputElement;
  if (gradeInput) {
    gradeInput.value = evaluation.grade;
    console.log("Grade populated:", evaluation.grade);
  } else {
    console.log("Grade input field not found!");
  }

  const commentIframe = document.querySelector("#comment_rce_textarea_ifr") as HTMLIFrameElement;
  if (commentIframe) {
    const commentDocument = commentIframe.contentDocument || commentIframe.contentWindow?.document;
    const commentTextarea = commentDocument?.querySelector("#tinymce");
    if (commentTextarea) {
      commentTextarea.innerHTML = evaluation.comments;
      console.log("Comment populated:", evaluation.comments);
    } else {
      console.log("Comment textarea not found in iframe!");
    }
  } else {
    console.log("Comment iframe not found!");
  }

  selectRubricOptions(evaluation);
}
  
  