'use strict';
const remote = require('electron').remote;
const nene = remote.getGlobal('nene');

$(() => {
        nene.on('started', (source, title, ep) => {
                const text = title + (ep ? (' - Episode ' + ep) : '');
                $('#watching').text(text);
                $(`#watching-${source}`).text(text);
        });
        nene.on('stopped', (source, error, wasMain) => {
                if (wasMain) {
                        $('#watching').text('');
                }
                $(`#watching-${source}`).text('');
        });
        nene.on('player-active', source => {
                $(`#active-${source}`).text('active');
        });
        nene.on('player-inactive', source => {
                $(`#active-${source}`).text('');
        });
});
