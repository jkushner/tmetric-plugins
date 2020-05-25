﻿class Evernote implements WebToolIntegration {
    matchUrl = '*://www.evernote.com/client/*';
    issueElementSelector = '#qa-NOTE_HEADER';//'#qa-NOTE_DETAIL';
    showIssueId = false;
    observeMutations = true;
    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        let div = $$.create('div');
        div.classList.add('devart-timer-link-evernote');
        div.appendChild(linkElement);
        let separator = $$.create('div', '_3QvRa8NWQ7oFT2wasqKjdo');
        div.appendChild(separator);
        issueElement.lastChild.before(div);
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {
        const isIFrame = (input: HTMLElement | null): input is HTMLIFrameElement =>
            input !== null && input.tagName === 'IFRAME';

        // try to get issue name from editor
        let frame = $$.try('#qa-COMMON_EDITOR_IFRAME');
        if (isIFrame(frame) && frame.contentDocument) {
            var issueName = ($$.try('en-noteheader textarea', frame.contentDocument) as HTMLTextAreaElement).value;
        }

        // try to get issue name from sidebar
        if (!issueName) {
            let sidebarSelectedItem = $$('.TSUJykWrzFUwd6gUIDTTl');
            if (sidebarSelectedItem) {
                issueName = $$.try('[id$=qa-NOTES_SIDEBAR_NOTE_TITLE]', sidebarSelectedItem).textContent;
            }
        }

        if (issueName == '') {
            issueName = 'Untitled';
        }

        if (!issueName) {
            return;
        }

        let projectName = $$.try('#qa-NOTE_PARENT_NOTEBOOK_BTN', issueElement).textContent;
        let issueId = $$.searchParams(source.fullUrl)['n'];
        let issueUrl = issueId && `${source.path}#?n=${issueId}`;
        let serviceUrl = source.protocol + source.host;

        return { issueName, issueId, issueUrl, projectName, serviceUrl, serviceType: 'Evernote' };
    }
}

IntegrationService.register(new Evernote());