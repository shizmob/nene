const { Nene, registerAllPlayers, registerAllSinks } = require('./lib');

let nene;

$(() => {
        nene = new Nene();

        nene.on('ready', (config) => {
                registerAllPlayers(nene, config);
                registerAllSinks(nene, config);
        })
        nene.on('watching', (source, title, ep) => {
                const text = title + (ep ? (' - Episode ' + ep) : '');
                $('#watching').text(text);
                $(`#watching-${source}`).text(text);
        });
        nene.on('stopped-watching', (source, error, wasMain) => {
                if (wasMain) {
                        $('#watching').text('');
                }
                $(`#watching-${source}`).text('');
        });
        nene.on('client-active', source => {
                $(`#active-${source}`).text('active');
        });
        nene.on('client-inactive', source => {
                $(`#active-${source}`).text('');
        });

        nene.start();
});
