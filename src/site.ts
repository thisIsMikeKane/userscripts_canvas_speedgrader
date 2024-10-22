// This file cannot contain Webpack-resolved imports (e.g. "~src/foo").
declare global {
  interface Window {
    tinymce: any;
  }
}

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
    //TODO check if the contents say 
    // <div id="this_student_does_not_have_a_submission" style="">
    //   <h3>
    //       This student does not have a submission for this assignment
    //   </h3>
    // </div>
    // <div id="this_student_has_a_submission" style="display: none;">
    //   <h3>
    //     This student has submitted the assignment
    //     <span class="subheader">This student's responses are hidden because this assignment is anonymous.</span>
    //   </h3>
    // </div>
    // <div id="iframe_holder" style="display: none;"></div>
    // <div id="resize_overlay" style="display:none;"></div>
        
    console.log("Iframe not found!");
    return null;
  }
}
  
export function populateGradeFields(evaluation: Evaluation): void {

  // Populate grade text field
  const gradeInput = document.querySelector("#grading-box-extended") as HTMLInputElement;
  if (gradeInput) {
    gradeInput.value = evaluation.grade;
    console.log("Grade populated:", evaluation.grade);
  } else {
    console.log("Grade input field not found!");
  }

  // Access TinyMCE from the main window
  const tinymce = unsafeWindow.tinymce;
  if (tinymce?.activeEditor) {
    console.log("TinyMCE active editor found!");
    tinymce.activeEditor.setContent(evaluation.comments);
  } else {
    console.log("TinyMCE active editor not found!");
  }
  triggerCommentSubmit();

  // Fill out rubric
  selectRubricOptions(evaluation);
  triggerRubricSubmit();
}
  
  