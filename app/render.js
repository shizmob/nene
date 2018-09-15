'use strict';
const $ = require('jquery');
const nene = require('electron').remote.getGlobal('nene');


const setWatching = (source, current) => {
        const text = current.title + (current.ep ? ` - ${current.ep}` : '');
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

const setActive = (source, type) => {
        $(`#${type}s`).append(`<li id="${type}-${source}">${source}: <span id="watching-${source}" /></li>`);
};

const clearActive = (source, type) => {
        $(`#${type}-${source}`).remove();
};

const setPlayerActive = (source) => setActive(source, 'player');
const clearPlayerActive = (source) => clearActive(source, 'player');
const setSinkActive = (source) => setActive(source, 'sink');
const clearSinkActive = (source) => clearActive(source, 'sink');


$(() => {
        nene.on('started', setWatching);
        nene.on('stopped', clearWatching);
        nene.on('player-active', setPlayerActive);
        nene.on('player-inactive', clearPlayerActive);
        nene.on('sink-active', setSinkActive);
        nene.on('sink-inactive', clearSinkActive);
        nene.getActive('player').map(setPlayerActive);
        nene.getActive('sink').map(setSinkActive);
});

$(window).on('beforeunload', () => {
        nene.removeListener('started', setWatching);
        nene.removeListener('stopped', clearWatching);
        nene.removeListener('player-active', setPlayerActive);
        nene.removeListener('player-inactive', clearPlayerActive);
        nene.removeListener('sink-active', setSinkActive);
        nene.removeListener('sink-inactive', clearSinkActive);
});
