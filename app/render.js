'use strict';
const $ = require('jquery');
const nene = require('electron').remote.getGlobal('nene');


const setWatching = (source, title, ep) => {
        const text = title + (ep ? (' - Episode ' + ep) : '');
        $('title').text(`nene - [${text}]`);
        $('#watching').text(text);
        $(`#watching-${source}`).text(text);
};

const clearWatching = (source, error, wasMain) => {
        if (wasMain) {
                $('title').text('nene');
                $('#watching').text('');
        }
        $(`#watching-${source}`).text('');
};

const setActive = source => {
        $(`#active-${source}`).text('active');
};

const clearActive = source => {
        $(`#active-${source}`).text('');
};


$(() => {
        nene.on('started', setWatching);
        nene.on('stopped', clearWatching);
        nene.on('player-active', setActive);
        nene.on('player-inactive', clearActive);
});

$(window).on('beforeunload', () => {
        nene.removeListener('started', setWatching);
        nene.removeListener('stopped', clearWatching);
        nene.removeListener('player-active', setActive);
        nene.removeListener('player-inactive', clearActive);
});
