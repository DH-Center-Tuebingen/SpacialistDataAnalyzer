# Spacialist Data Analyzer

Spacialist Data Analyzer is a web application that allows users to analyze data in any of their [Spacialist](https://github.com/DH-Center-Tuebingen/Spacialist) databases.

## Prerequisites
* Spacialist (at least v0.6, compatibility tested up to v0.10) running on your server with at least one database (see [Spacialist installation instructions](https://github.com/eScienceCenter/Spacialist/blob/master/INSTALL.md))
* PHP with extension `PDO_PGSQL` enabled
* Configure your web server to serve `index.php` as a directory index, e.g. in Apache: `DirectoryIndex index.php`

## Installation
* Clone this repository into any folder served by your web server. The target folder is hereafter referred to as the app folder
* Run `npm install` and `composer install` in the app folder
* In the app folder, create a `global.ini` file with an entry `spacialist_root` that reflects the absolute local filesystem location of the parent folder of your Spacialist instances, and an entry `spacialist_webroot` pointing to the path portion of its external URL. For example:
    ```
    spacialist_root=/var/www/spacialist
    spacialist_webroot=/spacialist
    ```

## Usage
It is assumed that under the Spacialist instance folder, the actual Spacialist frontend will be served from subfolder `s`, and the Spacialist Data Analyzer app will be symbolically linked from a sibling folder `analysis`. In this case, the app will find the `.env` file of the present Spacialist instance automatically, and you simply direct your browser to the app directory, e.g. `https://my.spacialist-server.com/spacialist/some-instance/analysis`

If you are not using this default setup, direct your browser to the URL of the app folder and provide a parameter `env` that reflects the name of the folder of the Spacialist instance relative to the `spacialist_root` setting defined in `global.ini`.

For instance, if the Spacialist Data Analyzer app is in the folder `data-analyzer`, and you would like to use the app with the Spacialist instance in the folder `test`, then the target URL would be `https://my.spacialist-server.com/spacialist/data-analyzer/?env=test`

If successful, the browser should display a login page. If opened via a hyperlink from within Spacialist, no login should be necessary.

The properties of the `Settings` object in `js/global.js` can be overridden, by providing a JSON object in a file named like the database and located in the `settings` subfolder. E.g., for the database `test`, putting `{ "Settings": { "forceLiveDb": false } }` into the file `settings/test.json` will override the default setting for this property and make the tool fetch the database from the cache rather than loading it from the PostgreSQL database upon every visit.

Read the **[User Manual](https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/User-Manual)** to learn how to use Spacialist Data Analyzer.

## Screenshot

The screenshot below shows the Spacialist Data Analyzer main window, offering a hierarchical view of the **[structure of data](https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/Database-Structure-Pane)** in the database (tree on the left), various **[analysis options](https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/Analysis-Options-Pane)** (right-top pane, allowing selecting what kind of data to display, filtering based on entity properties, as well as grouping with and aggregation of property values), and various kinds of **[result displays](https://github.com/eScienceCenter/SpacialistDataAnalyzer/wiki/Result-Pane)** including geomaps and tabular data (right-bottom pane).

![scr_main]

## License

Spacialist Data Analyzer is licensed using the [MIT License](LICENSE.md).

## Acknowledgments

Development of this tool was co-funded from 2016-2018 by the Ministry of Science, Research and the Arts Baden-Württemberg in the "E-Science" funding programme under the grant "Spacialist". Since then, further development was carried until 2022 by the eScience-Center and since 2022 by the [Digital Humanities Center](https://dh-center.uni-tuebingen.de) at University of Tübingen.

[scr_main]: https://github.com/eScienceCenter/eScienceCenter.github.io/blob/master/assets/SpacialistDataAnalyzer/screenshots/main-window-readme.png?raw=true "Spacialist Data Analyzer"
