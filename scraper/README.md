# scraper for quarks klimawetter app

Installation

```sh
npm install
```

To download fresh daily weather data:

```sh
npm run weather
```

To download historical weather context:

```sh
npm run context
```

Historical data sources will be cached in `./cache/` (since those don't change most of the time). If you want to re-download them anyway use:

```sh
npm run drop-cache
```