const save_options = () => {
    let prj = document.getElementById('project').value;
    let usr = document.getElementById('user').value;
    chrome.storage.sync.set({
        project: prj,
        user: usr
    }, () => {
        let status = document.getElementById('status');
        status.textContent = 'Options saved.';
        status.hidden = false;
        setTimeout(() => {
            status.textContent = '';
            status.hidden = true;
        }, 1000);
    });
}

const restore_options = () => {
    chrome.storage.sync.get({
        project: 'Sunshine',
        user: 'nyx.linden'
    }, (items) => {
        document.getElementById('project').value = items.project;
        document.getElementById('user').value = items.user;
    });

    document.getElementById('save').addEventListener('click', save_options);
}

document.addEventListener('DOMContentLoaded', restore_options);
