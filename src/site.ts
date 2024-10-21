// This file cannot contain Webpack-resolved imports (e.g. "~src/foo").

import U from "./userscript";
import { Evaluation } from "./grade_submission";
import { selectRubricOptions } from "./rubric";

export const NAME = U.sitename;
export const HOSTNAME = U.hostname;

export function triggerRubricSubmit(): void {
  const submitButton = document.querySelector(".save_rubric_button") as HTMLElement;
  if (submitButton) {
    submitButton.click();
    console.log("Submit rubric button clicked!");
  } else {
    console.log("Submit rubric button not found!");
  }
}

export function triggerCommentSubmit(): void {
  const submitButton = document.querySelector("#comment_submit_button") as HTMLElement;
  if (submitButton) {
    submitButton.click();
    console.log("Submit comment button clicked!");
  } else {
    console.log("Submit comment button not found!");
  }
}

export function toggleRubric(): void {
  const event = new KeyboardEvent("keydown", {
    key: "r",
    code: "KeyR",
    keyCode: 82,
    charCode: 82,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  console.log("Rubric toggle key event dispatched!");
}

export function nextSubmission(): void {
  const event = new KeyboardEvent("keydown", {
    key: "j",
    code: "KeyJ",
    keyCode: 74,
    charCode: 74,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  console.log("Next submission key event dispatched!");
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

      // Select the textarea within the iframe (assuming it's the only editable field)
      const textarea = commentIframe?.querySelector("body");

      if (textarea) {
          // Focus the textarea element, placing the cursor inside it
          textarea.focus();

          // Create and dispatch a 'Tab' key event
          const tabKeyEvent = new KeyboardEvent("keydown", {
              key: "Tab",
              keyCode: 9,
              code: "Tab",
              which: 9,
              bubbles: true,
              cancelable: true
          });

          // Dispatch the event to simulate pressing the Tab key
          textarea.dispatchEvent(tabKeyEvent);
      }

      triggerCommentSubmit();
    } else {
      console.log("Comment textarea not found in iframe!");
    }
  } else {
    console.log("Comment iframe not found!");
  }
  //TODO click submit button

  selectRubricOptions(evaluation);
}
  
  