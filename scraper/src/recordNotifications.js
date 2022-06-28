const path = require('path');
const dayjs = require('dayjs');
const { parallelLimit } = require('async');
const got = require('got');

const { loadFile } = require('./io.js');

function makeCard(body) {
    return {
        type: 'AdaptiveCard',
        body: body,
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4'
    };
}

function makeTeamsPayload(card) {
    return {
        type: 'message',
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.adaptive',
                contentUrl: null,
                content: card
            }
        ]
    };
}

function formatTemperature(temp) {
    return `${temp.toFixed(1)}°C`.replace('.', ',');
}

async function sendNotification(records) {
    const header = {
        type: 'TextBlock',
        size: 'Medium',
        weight: 'Bolder',
        text: 'Wetter-Rekorde'
    };

    let subtitle;

    if (records.length === 0) {
        subtitle = {
            type: 'TextBlock',
            wrap: true,
            text: 'Für heute sind keine Wetter-Rekorde vorhergesagt.'
        };
    } else {
        subtitle = {
            type: 'TextBlock',
            wrap: true,
            text: 'Die folgenden Temperatur-Rekorde sind für heute vorhergesagt:'
        };
    }

    let containers;

    if (records.length < 10) {
        containers = records.map(record => ({
            type: 'Container',
            items: [
                {
                    type: 'FactSet',
                    facts: [
                        {
                            title: 'Wetterstation',
                            value: record.station.name
                        },
                        {
                            title: 'Typ',
                            value: record.type == 'hi' ? 'Wärmerekord' : 'Kälterekord'
                        },
                        {
                            title: 'Jahr des bisherigen Rekords',
                            value: record.previous.year
                        },
                        {
                            title: 'Bisheriger Rekord',
                            value: formatTemperature(record.previous.TXK)
                        },
                        {
                            title: 'Neuer Rekord',
                            value: formatTemperature(record.TXK)
                        }
                    ]
                },
                {
                    type: 'ActionSet',
                    actions: [
                        {
                            type: 'Action.OpenUrl',
                            title: 'Ansehen',
                            url: `https://www.quarks.de/umwelt/klimawandel/wetter-oder-klimawandel-2/#/${record.station.slug}`
                        }
                    ]
                }
            ],
            spacing: 'Large',
            separator: true
        }));
        if (containers.length > 0) {
            containers[0].separator = false;
        }
    } else {
        containers = records.map(record => ({
            type: 'TextBlock',
            text: `${record.type == 'hi' ? '🔥' : '🧊'} [${
                record.station.name
            }](https://www.quarks.de/umwelt/klimawandel/wetter-oder-klimawandel-2/#/${
                record.station.slug
            })`,
            wrap: true
        }));
    }

    const card = makeCard([header, subtitle, ...containers]);
    const payload = makeTeamsPayload(card);

    const teamsWebhook = process.env.TEAMS_WEBHOOK;

    if (teamsWebhook) {
        console.log(`Sending notification to Teams...`);
        console.log(JSON.stringify(payload, null, 2));

        const response = await got.post(teamsWebhook, {
            json: payload
        });
        console.log(response.body);
    }
}

async function notifyRecords() {
    const stations = JSON.parse(await loadFile('stations.json'));

    const promises = stations.map(station => async () => {
        const ctx = JSON.parse(
            await loadFile(path.join('stations', 'context', `${station.id}.json`))
        );
        const weather = JSON.parse(
            await loadFile(path.join('stations', 'weather', `${station.id}.json`))
        );

        const today = dayjs().startOf('day');
        const todayFmtFull = today.format('YYYY-MM-DD');
        const todayFmtDay = today.format('MM-DD');

        const weatherToday = weather.data.filter(d => d.date === todayFmtFull)[0];
        const ctxToday = ctx.daily[todayFmtDay];

        if ([weatherToday, ctxToday].includes(undefined)) {
            console.log(`No data today for station ${JSON.stringify(station, null, 2)}`);
            return;
        }

        const TXK_hi = ctxToday.TXK_records.hi[2];
        const TXK_lo = ctxToday.TXK_records.lo[0];

        if (weatherToday.TXK >= TXK_hi.TXK) {
            return {
                station: station,
                TXK: weatherToday.TXK,
                previous: TXK_hi,
                type: 'hi'
            };
        } else if (weatherToday.TXK <= TXK_lo.TXK) {
            return {
                station: station,
                TXK: weatherToday.TXK,
                previous: TXK_lo,
                type: 'lo'
            };
        }
    });

    const records = await parallelLimit(promises, 4);

    await sendNotification(records.filter(r => r));
}

module.exports = { notifyRecords };
