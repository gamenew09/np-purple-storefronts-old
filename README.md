NoPixel Storefront Map
====
> Currently is not fully up-to-date. Working on making this fully a thing soon.

[Live page](https://gamenew09.github.io/np-purple-storefronts/)
This interactive (Google) map shows you the location of current NoPixel Purple storefronts.

## How to submit new locations
1. Right click on the map to add points. (You should only add one point for where people enter the storefront.)
2. Click "Add New Region" to print out the region data.
3. Replace "\<edit this\>" with correct information.
4. Replace the id with an unused id while trying to maintain the pattern in `locations.json`
5. Change the type, add a video or images, and change the color of the region.
6. Add new region to `locations.json` and create a pull request.

Alternatively a new issue can be created the region data and it will be added.

## How to host yourself

1. Clone this repository
2. Host the repository using Nginx, Apache, or another webserver.

To host the repository using Python 3 use in the root of the repository:
```
python -m http.server
```

## License

[WTFPL](LICENSE)

## Version

0.0.1

## Credits

To [skyrossm](https://github.com/skyrossm/np-gangmap) for [their work](https://github.com/skyrossm/np-gangmap) that this map is based wholly on.

### skyrossm Original Credits:
To [danharper](https://github.com/danharper/) for [his work](https://github.com/danharper/GTAV) on the GTA V map.
To [gta5-map](https://github.com/gta5-map) for [their work](https://github.com/gta5-map/gta5-map.github.io) on the GTA V map.

## Star History

By starring this repository you attract contributors to invest time into maintaing it.

[![Star History Chart](https://api.star-history.com/svg?repos=gamenew09/np-purple-storefronts&type=Date)](https://star-history.com/#gamenew09/np-purple-storefronts)
