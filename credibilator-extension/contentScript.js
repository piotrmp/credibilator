{
	let content=unfluffPacked.extractUnfluff(document.documentElement.outerHTML);
	// send the content to extension popup
	chrome.runtime.sendMessage({pageURL:window.location.href, pageTitle:document.title, textContent: content },function(response) {});
}
