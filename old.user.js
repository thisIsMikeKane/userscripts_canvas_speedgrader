// ==UserScript==
// @name         Canvas SpeedGrader Hotkeys and ChatGPT Integration with Assistant
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Adds hotkeys to Canvas SpeedGrader, integrates ChatGPT API for content extraction with a specific assistant, and parses evaluation response schema from ChatGPT response for grading automation with proper assistant creation and improved error handling. Now includes fetching messages after run completion and a defined sendToChatGPT function to fix ReferenceError. Updates grade and comment fields correctly in the main document.
// @author       Michael Kane
// @match        https://northeastern.instructure.com/courses/*/gradebook/speed_grader*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // Function to trigger the submit button
    function triggerSubmit() {
        const submitButton = document.querySelector('.save_rubric_button');
        if (submitButton) {
            submitButton.click();
            console.log('Submit button clicked!');
        } else {
            console.log('Submit button not found!');
        }
    }

    // Function to extract text from an iframe
    function extractContentFromIframe() {
        const iframe = document.querySelector('iframe#speedgrader_iframe');
        if (iframe) {
            console.log('Found iFrame.');
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            console.log('Found iFrame document.');
            const contentElement = iframeDocument.querySelector('div#content.ic-Layout-contentMain');
            console.log('Found iFrame element.');
            if (contentElement) {
                return contentElement.innerText.trim();
            } else {
                console.log('Targeted content element not found inside iframe!');
                return null;
            }
        } else {
            console.log('Iframe not found!');
            return null;
        }
    }

    // Function to get API key from GreaseMonkey value store or prompt the user
    async function getApiKey() {
        let apiKey = await GM_getValue('openai_api_key', null);
        if (!apiKey) {
            apiKey = prompt('Please enter your OpenAI API key:');
            if (apiKey) {
                await GM_setValue('openai_api_key', apiKey);
                console.log('API key saved successfully!');
            } else {
                console.log('No API key provided.');
            }
        }
        return apiKey;
    }

    // Function to create an assistant using XMLHttpRequest
    async function createAssistant(apiKey) {
        const assistantUrl = 'https://api.openai.com/v1/assistants';
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', assistantUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
            xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        console.log('Assistant created:', data.id);
                        GM_setValue('assistant_id', data.id);
                        resolve(data.id);
                    } else {
                        console.error('Error creating assistant:', xhr.statusText, xhr.responseText);
                        resolve(null);
                    }
                }
            };

            xhr.onerror = function() {
                console.error('XMLHttpRequest error while creating assistant');
                resolve(null);
            };

            xhr.send(JSON.stringify({
                instructions: "You are a grading assistant for Canvas SpeedGrader. Evaluate the student's response based on the specified rubric.",
                name: "SpeedGrader Assistant",
                model: "gpt-4o"
            }));
        });
    }

    // Function to create a thread for conversation using XMLHttpRequest
    async function createThread(apiKey) {
        const threadUrl = 'https://api.openai.com/v1/threads';
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', threadUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
            xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        console.log('Thread created:', data.id);
                        resolve(data.id);
                    } else {
                        console.error('Error creating thread:', xhr.statusText, xhr.responseText);
                        resolve(null);
                    }
                }
            };

            xhr.onerror = function() {
                console.error('XMLHttpRequest error while creating thread');
                resolve(null);
            };

            xhr.send(JSON.stringify({}));
        });
    }

    // Function to add a message to the thread using XMLHttpRequest
    async function addMessageToThread(apiKey, threadId, content) {
        const messageUrl = `https://api.openai.com/v1/threads/${threadId}/messages`;
        console.log(`Trying to send message to thread ${threadId}`);
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', messageUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
            xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        console.log('Message added to thread:', data);
                        resolve(true);
                    } else {
                        console.error('Error adding message to thread:', xhr.statusText, xhr.responseText);
                        resolve(false);
                    }
                }
            };

            xhr.onerror = function() {
                console.error('XMLHttpRequest error while adding message to thread');
                resolve(false);
            };

            xhr.send(JSON.stringify({
                role: 'user',
                content: content
            }));
        });
    }

    // Function to create a run to get the assistant response using XMLHttpRequest
    async function createRun(apiKey, threadId, assistantId) {
        const runUrl = `https://api.openai.com/v1/threads/${threadId}/runs`;
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', runUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
            xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        if (data.status === 'queued') {
                            console.log('Run is queued. Polling for completion...');
                            pollRunStatus(apiKey, threadId, data.id);
                        } else if (data.status === 'completed') {
                            console.log('Run completed. Fetching messages...');
                            fetchThreadMessages(apiKey, threadId);
                        } else {
                            console.error('Unexpected run status:', data);
                        }
                    } else {
                        console.error('Error creating run:', xhr.statusText, xhr.responseText);
                    }
                }
            };

            xhr.onerror = function() {
                console.error('XMLHttpRequest error while creating run');
            };

            xhr.send(JSON.stringify({
                assistant_id: assistantId
            }));
        });
    }

    // Function to poll the run status until it's complete
    async function pollRunStatus(apiKey, threadId, runId) {
        const runStatusUrl = `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`;
        const pollInterval = 5000; // Poll every 5 seconds
        let retries = 0;
        const maxRetries = 5;

        function poll() {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', runStatusUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
            xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        if (data.status === 'completed') {
                            console.log('Run completed. Fetching messages...');
                            fetchThreadMessages(apiKey, threadId);
                        } else if (data.status === 'queued' || data.status === 'in_progress') {
                            console.log('Run still in progress. Re-polling...');
                            if (retries < maxRetries) {
                                retries++;
                                setTimeout(poll, pollInterval);
                            } else {
                                console.error('Max retries reached. Run did not complete in time.');
                            }
                        } else {
                            console.error('Unexpected run status:', data);
                        }
                    } else {
                        console.error('Error polling run status:', xhr.statusText, xhr.responseText);
                    }
                }
            };

            xhr.onerror = function() {
                console.error('XMLHttpRequest error while polling run status');
            };

            xhr.send();
        }

        poll();
    }

    // Function to fetch thread messages after run completion
    async function fetchThreadMessages(apiKey, threadId) {
        const messagesUrl = `https://api.openai.com/v1/threads/${threadId}/messages`;
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', messagesUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
            xhr.setRequestHeader('OpenAI-Beta', 'assistants=v2');

            xhr.onreadystatechange = function() {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        console.debug(data);
                        if (data.data && data.data.length > 0 && data.data[0].content && data.data[0].content.length > 0) {
                            const messageContent = data.data[0].content[0].text;
                            console.log('Assistant response:', messageContent);
                            parseEvaluationResponse(messageContent);
                        } else {
                            console.error('No valid messages found in the thread response.');
                        }
                    } else {
                        console.error('Error fetching thread messages:', xhr.statusText, xhr.responseText);
                    }
                }
            };

            xhr.onerror = function() {
                console.error('XMLHttpRequest error while fetching thread messages');
            };

            xhr.send();
        });
    }

    // Function to parse evaluation response based on the provided JSON schema
    function parseEvaluationResponse(responseText) {
        try {
            const evaluation = JSON.parse(responseText.value);
            if (evaluation && typeof evaluation === 'object' && 'grade' in evaluation && 'comment' in evaluation && 'rubric' in evaluation) {
                console.log('Parsed Evaluation:', evaluation);

                // Assuming you want to automatically populate the grading fields based on the response
                populateGradeFields(evaluation);
            } else {
                console.error('Invalid response format:', responseText);
            }
        } catch (error) {
            console.error('Failed to parse response as JSON:', error);
        }
    }

    // Function to populate the grading fields in SpeedGrader
    function populateGradeFields(evaluation) {
        // Populate the grade field
        const gradeInput = document.querySelector('input#grading-box-extended');
        if (gradeInput) {
            gradeInput.value = evaluation.grade;
            console.log('Grade populated:', evaluation.grade);
        } else {
            console.log('Grade input field not found!');
        }

        // Populate the comment field
        const commentIframe = document.querySelector('iframe#comment_rce_textarea_ifr');
        if (commentIframe) {
            const commentDocument = commentIframe.contentDocument || commentIframe.contentWindow.document;
            const commentTextarea = commentDocument.querySelector('#tinymce');
            if (commentTextarea) {
                commentTextarea.innerHTML = evaluation.comment;
                console.log('Comment populated:', evaluation.comment);
            } else {
                console.log('Comment textarea not found in iframe!');
            }
        } else {
            console.log('Comment iframe not found!');
        }

        // Optionally, populate a rubric breakdown (if applicable)
        const rubricDiv = document.querySelector('div.rubric_breakdown');
        if (rubricDiv) {
            rubricDiv.innerHTML = evaluation.rubric;
            console.log('Rubric populated:', evaluation.rubric);
        } else {
            console.log('Rubric breakdown section not found!');
        }
    }

    
    // Function to send extracted text to ChatGPT
    async function sendToChatGPT(content) {
        const apiKey = await getApiKey();
        if (!apiKey) {
            console.log('API key is missing. Cannot proceed.');
            return;
        }

        let assistantId = await GM_getValue('assistant_id', null);
        if (!assistantId) {
            assistantId = await createAssistant(apiKey);
            if (!assistantId) {
                console.log('Failed to create assistant. Cannot proceed.');
                return;
            }
        }

        // Step 2: Create a Thread
        const threadId = await createThread(apiKey);
        if (!threadId) {
            return;
        }

        // Step 3: Add the User Message to the Thread
        const messageAdded = await addMessageToThread(apiKey, threadId, content);
        if (!messageAdded) {
            return;
        }

        // Step 4: Create a Run and Get the Assistant's Response
        await createRun(apiKey, threadId, assistantId);
    }

    // Listen for keydown events
    document.addEventListener('keydown', function(event) {
        // Trigger the submit button with 'S' key
        if (event.key === 's' || event.key === 'S') {
            triggerSubmit();
        }

        // Extract content from iframe and send to ChatGPT with 'C' key
        if (event.key === 'c' || event.key === 'C') {
            const extractedText = extractContentFromIframe();
            if (extractedText) {
                console.log('Extracted Text:', extractedText);
                sendToChatGPT(extractedText);
            } else {
                console.log('No text to send to ChatGPT.');
            }
        }
    });
})();
