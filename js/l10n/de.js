const l10n_de = {
    attributeTypeLabels: {
        integer: 'Ganzzahl',
        percentage: 'Prozentsatz',
        double: 'Zahl',
        boolean: 'Ja/Nein',
        string: 'Text',
        stringf: 'Text',
        relation: 'Relation',
        date: 'Datum',
        'string-sc': 'Auswahl',
        'string-mc': 'Mehrfachauswahl',
        table: 'Tabelle',
        geometry: 'Geometrie',
        epoch: 'Epoche',
        dimension: 'Dimension'
    },
    contextTypeDisplayLabels: {
        table: 'Tabelle',
        map: 'Karte',
        count: 'Anzahl'
    },
    attributeDisplayTypeLabels: {
        table: 'Tabelle',
        count: 'Anzahl',
        share: 'Anteil an Wertverteilung',
        distribution: 'Wertverteilung',
        sum: 'Summe der Werte',
        max: 'Maximalwert',
        min: 'Minimalwert',
        avg: 'Durchschnittswert',
        group: 'Gruppieren nach dieser Eigenschaft',
        'list-links': 'Liste von Verknüpfungen zu Entitäten',
        'list-entities': 'Liste der Entitäten',
        'count-true': 'Anzahl Ja-Werte',
        'count-false': 'Anzahl Nein-Werte',
        'count-rows-total': 'Gesamtanzahl der Zeilen',
        'count-rows-avg': 'Durchschnittsanzahl der Zeilen',
        'sum-area': 'Flächensumme',
        'avg-area': 'Durschnittsfläche',
        'min-area': 'Kleinste Fläche',
        'max-area': 'Größte Fläche',
        'min-start': 'Frühester Anfang',
        'max-start': 'Spätester Anfang',
        'avg-start': 'Durschnittlicher Anfang',
        'min-end': 'Frühestes Ende',
        'max-end': 'Spätestes Ende',
        'avg-end': 'Durchschnittliches Ende',
        'avg-b': 'Durchschnittliche Breite',
        'min-b': 'Kleinste Breite',
        'max-b': 'Größte Breite',
        'avg-h': 'Durchschnittliche Höhe',
        'min-h': 'Niedrigste Höhe',
        'max-h': 'Größte Höhe',
        'avg-t': 'Durchschnittliche Tiefe',
        'min-t': 'Kleinste Tiefe',
        'max-t': 'Größte Tiefe',
        'avg-3d': 'Durchschnittsvolumen',
        'min-3d': 'Kleinstes Volumen',
        'max-3d': 'Größtes Volumen',
        'avg-bh': 'Durchschnittliche Fläche (Breite x Höhe)',
        'min-bh': 'Kleinste Fläche (Breite x Höhe)',
        'max-bh': 'Größte Fläche (Breite x Höhe)',
        'avg-bt': 'Durchschnittliche Fläche (Breite x Tiefe)',
        'min-bt': 'Kleinste Fläche (Breite x Tiefe)',
        'max-bt': 'Größte Fläche (Breite x Tiefe)',
        'avg-ht': 'Durchschnittliche Fläche (Höhe x Tiefe)',
        'min-ht': 'Kleinste Fläche (Höhe x Tiefe)',
        'max-ht': 'Größte Fläche (Höhe x Tiefe)'
    },
    objectFilterLabels: {
        length: 'Anzahl der Zeichen',
        count: 'Anzahl',
        rows: 'Anzahl der Zeilen',
        exist: 'Hat einen Wert',
        'not-exist': 'Hat keinen Wert',
        lower: 'Kleiner als',
        'lower-equal': 'Kleiner oder gleich',
        greater: 'Größer als',
        'greater-equal': 'Größer oder gleich',
        equal: 'Gleich',
        'equal-thesaurus': 'Entspricht Thesauruskonzept',
        'not-equal': 'Ungleich',
        'not-equal-thesaurus': 'Entspricht nicht Thesauruskonzept',
        contain: 'Beinhaltet',
        'contain-thesaurus': 'Beinhaltet Thesauruskonzept',
        'not-contain': 'Beinhaltet nicht',
        'not-contain-thesaurus': 'Beinhaltet nicht Thesauruskonzept',
        'descendant-thesaurus': 'Untergeordnetes Thesauruskonzept von',
        'not-descendant-thesaurus': 'Nicht untergeordnetes Thesauruskonzept von',
        'contain-descendant-thesaurus': 'Enthält untergeordnetes Thesauruskonzept von',
        'not-contain-descendant-thesaurus': 'Enthält kein untergeordnetes Thesauruskonzept von',
        empty: 'Ist leer',
        'not-empty': 'Ist nichtleer',
        'dimension-b': 'Breite',
        'dimension-h': 'Höhe',
        'dimension-t': 'Tiefe',
        'dimension-bh': 'Fläche: Breite × Höhe',
        'dimension-bt': 'Fläche: Breite × Tiefe',
        'dimension-ht': 'Fläche: Höhe × Tiefe',
        'dimension-bht': 'Volumen',
        'dimension-unit': 'Maßeinheit (cm, m, …)',
        'epoch-start': 'Anfang',
        'epoch-end': 'Ende',
        'epoch-concept': 'Bezeichnung des Zeitraums',
        'epoch-timespan': 'Zeitspanne',
        'geometry-type': 'Geometrietyp',
        'geometry-area': 'Fläche',
        'geometry-wkt': 'WKT-Repräsentation',
    },
    dbAttributeGeometry: 'Geometrie',
    dbAttributeName: 'Name',
    dbAttributeID: 'ID',
    dbSpacialistLinkTitle: 'Klicken um diese %s-Entität in Spacialist auszuwählen',
    dbEntityDetailsTitle: 'Klicken um Details dieser %s-Entität anzuzeigen',
    dbResultPropertyNoValue: 'Für diese Eigenschaft gibt es keine Werte',
    dbReloadTooltip: 'Aktualisieren der Datenbankkopie',
    dbReloadModalTitle: 'Datenbank aktualisieren',
    dbReloadModalTimestamp: 'Zeitpunkt der letzten Aktualisierung: %s',
    dbReloadModalInfo: 'Das Analysetool verwendet eine zwischengespeicherte Version der Spacialist-Datenbank, um die Analysen zu beschleunigen. Wenn Sie den Fortfahren-Knopf drücken, wird diese lokale Datenbankkopie auf den aktuellen Stand gebracht. Das Neuladen der Datenbank dauert einige Sekunden. Im Hintergrund werden dann noch für die Analyse benötigte Werte berechnet, was einige Minuten dauern kann. Die meisten für das Analysetool benötigten Daten sind aber während dieser Hintergrundberechnungen bereits verfügbar und das Tool ist einsatzbereit. Während dieser Bereichnungen wird in der Statuszeile der Text "Hintergrundberechnungen laufen" angezeigt werden. Ihre derzeitigen Analyseeinstellungen gehen jedenfalls verloren. Wollen Sie fortfahren?',
    dbReloadModalOK: 'Fortfahren',
    dbReloadModalCancel: 'Abbrechen',

    treeCaption: 'Datenbankstruktur',
    treeHideProperties: 'Einklappen',
    treeShowProperties: 'Ausklappen',
    treeHeadOutput: 'Ausgabe',
    treeHeadFilter: 'Filter',
    treeHeadAggregate: 'Aggregat',

    analysisOptionsCaption: 'Analyse-Einstellungen',
    analysisClearButton: '🞬 Zurücksetzen',
    analysisSaveButton: '🖫 Speichern',
    analysisLoadButton: '⮬ Laden',
    analysisClearButtonTooltip: 'Alle Analyseeinstellungen zurücksetzen',
    analysisSaveButtonTooltip: 'Analyse in Datei speichern',
    analysisLoadButtonTooltip: 'Analyse aus Datei laden',
    analysisTabOutput: 'Ausgabe',
    analysisTabFilters: 'Filter',
    analysisTabAggregates: 'Aggregate',

    outputSelectHint: 'Wählen Sie aus, welche Daten Sie darstellen wollen, indem Sie im Baum eine Entität oder Eigenschaft auswählen.',
    outputSelectedEntityType: 'Sie haben Entitätstyp <b>%s</b> ausgewählt.',
    outputSelectedProperty: 'Sie haben Eigenschaft <b>%s</b>%s von Entitätstyp <b>%s</b> ausgewählt.',
    outputSelectedPropertyParent:  ' der zusammengesetzten Eigenschaft <b>%s</b>',
    outputSelectPropertyDisplayType: 'Wählen Sie, welche Information über diese Eigenschaft dargestellt werden soll: ',
    outputSelectEntityDisplay: 'Wählen Sie, wie die Entitäten dieses Typs dargestellt werden sollen: ',
    outputHierarchicalAnalysis: 'Hierarchische Analyse durchführen. Wenn diese Box angekreuzt ist, so wird die hierarchische Ebene der Entitäten des gewählten Typs %s berücksichtigt; es werden dann nur Entitäten auf der im Baum gewählten Ebene für das Ergebnis berücksichtigt. Wenn diese Box nicht angekreuzt ist, werden alle Entitäten des Typs %s für die Analyse berücksigt.',

    filterIntro: 'Definieren Sie in der folgenden Tabelle beliebige Filter, um die Analyse auf Entitäten mit bestimmten Eigenschaftswerten zu fokussieren. Sie können Filter hinzufügen, entfernen oder verschieben. Um einen Filter in der aktuellen Tabellenzeile (gelb hinterlegt) zu setzen, klicken Sie auf eine Eigenschaft im Baum. Um eine andere Tabellenzeile zu aktivieren, klicken Sie die gewünschte Zeile. Die Reihung der Filter kann durch Drag & Drop der Tabellenzeilen verändert werden. Bei der Auswertung der Filter wird die hierarchische Position der gewählten Eigenschaft im Baum berücksichtigt.',
    filterConjunctionHeading: 'Konjunktion',
    filterAndOrCombine: 'Kombiniert mit',
    filterRemoveTooltip: 'Filter entfernen',
    filterObjectAttrParent: ' in %s',
    filterObjectAttrContextType: ' von %s',
    filterDiscardTableRows: "Während der Berechnung aggregierter Werte (e.g. <i>Anzahl</i>, <i>Summe</i>, <i>Maximalwert</i>, etc.) sollen <span class='outputObjectName'></span>-Tabellen auf jene Zeilen reduziert werden, die den Filtern für diese Tabelle entsprechen. Hinweis: Diese Box ist ausgegraut, wenn Sie keinen Filter auf Tabelleneigenschaften Entitäten des Typs <span class='outputObjectName'></span> gesetzt haben.",
    filterDiscardTableRowsOutputObjectNameTable: 'Tabelleneigenschaft %s',
    filterDiscardTableRowsOutputObjectNameEntity: 'der auszugebenden Entität',
    filterTableCols: {
        what: 'Entitätstyp/Eigenschaft',
        transformation: 'Transformation',
        operator: 'Filteroperator',
        value: 'Filterwert'
    },
    filterAdd: 'Filter Hinzufügen',
    filterRemoveAll: 'Alle Filter Entfernen',
    filterNoDescendantConcepts: 'Keine Konzepte zur Auswahl',

    groupIntro: 'Hier können Sie definieren, wie die Eigenschaftswerte der Entitäten des Typs <b class="outputObjectName"></span> im Ergebnis gruppiert oder aggregiert werden sollen. Falls Sie gruppierte Eigenschaften definieren, werden die aggregierte Eingenschaften für jede Kombination der gruppierten Eigenschaften separat berechnet. Eigenschaften, die weder gruppiert noch aggregiert werden, scheinen im Ergebnis nicht auf.',
    groupDropdownPlaceholder: 'Ignorieren',
    groupReset: 'Zurücksetzen',
    groupTableColProperty: 'Eigenschaft von %s',
    groupTableColSelect: 'Gruppierung/Aggregat auswählen',

    resultToggleFullscreen: '◨ Vollbildschirm',
    resultDownloadGeoJson: '🖫 GeoJSON',
    resultToggleFullscreenTooltip: 'Vollbildschirm ein- bzw. ausschalten',
    resultDownloadGeoJsonTooltip: 'Ergebnis als GeoJSON-Datei herunterladen',
    resultShowTableModal: 'Anzeigen',
    resultShowTableModalTooltip: 'Datentabelle dieser Eigenschaft anzeigen',
    resultNone: 'Leeres Ergebnis',
    resultNoValue: 'Kein Wert',
    resultNoCoordinates: 'Das Ergebnis beinhaltet %s Entitäten, aber keine davon hat Geokoordinaten.',
    resultGeoJsonNone: 'Die Tabelle enthält keine Entitäten mit Geokoordinaten. Der GeoJSON Download wird daher abgebrochen.',
    resultMapFitToContentTooltip: 'Kartenzoom an Inhalt anpassen',
    resultTableButtons: {
        excel: 'Excel',
        copy: 'Kopieren',
        print: 'Drucken',
        colvis: 'Spalten'
    },
    resultTableButtonTooltips: {
        excel: 'Tabelle als Excel-Datei herunterladen',
        copy: 'Tabelle in die Zwischenablage kopieren',
        print: 'Tabelle für Ausdrucken vorbereiten',
        colvis: 'Spalten ein- und ausblenden'
    },
    resultTableLimit: 'Die Tabelle ist auf die ersten %s von insgesamt %s Einträgen limitiert. Definieren Sie Filter oder Aggregate, um die Anzahl der Ergebnisse zu verringern.',
    resultButtonLabel: 'Ergebnis Anzeigen',
    resultTableShowMore: '[mehr anzeigen]',
    resultTableShowMoreListItems: '[restliche %s anzeigen]',
    
    statusAnalysisLoading: 'Lade Analyse...',
    statusAnalysisReadFromFile: 'Lese Analyse aus Datei...',
    statusAnalysisLoaded: 'Analyse geladen.',
    statusDownloadComplete: 'Herunterladen abgeschlossen.',
    statusInitUI: 'Initialisiere Anwendungsfenster',
    statusFetchDB: 'Lade Datenbank',
    statusLoadComputedProperties: 'Hintergrundberechnungen laufen...',
    
    labelNone: 'Keine',
    labelLogout: 'Ausloggen',
    labelLoading: 'Lade...',

    loginHint: 'Bitte loggen Sie sich mit Ihrem Spacialist-Benutzerkonto ein',
    loginEmail: 'Email-Adresse',
    loginPassword: 'Passwort',
    loginButton: 'Einloggen',
    loginInvalid: 'Email-Adresse oder Password ungültig!',
    loginLangTooltip: 'Wählen Sie eine Sprache für diese Login-Seite aus',

    entityDetailsChildEntities: 'Untergeordnete: %s',
    entityDetailsHierarchyLabel: 'Hierarchie',
    entityDetailsHierarchyTopLevel: 'Diese Entität ist auf oberster Ebene',
    entityDetailsShowInSpacialist: 'Diese %s-Entität in Spacialist ansehen',
    entityDetailsHistoryPrev: 'Im Verlauf zur vor vorigen Entität zurückgehen',
    entityDetailsHistoryNext: 'Im Verlauf zur nächsten Entität weitergehen',

    errorHeading: 'Fehler',
    errorContactWithInfo: 'Fehlerbericht: %s',
    errorLoadComputedProperties: 'Die berechneten Eigenschaften konnten nicht geladen werden. Fehlerinformation:\n\n%s',
    errorAnalysisLoadInvalid: 'Diese Datei ist keine gültige Spacialist Analysedatei!',
    errorAnalysisLoadOther: 'Fehler beim Laden der Analyse.',
    errorContextTypeFilterNotImpl: 'Filtern von Entitätstypen wird nicht unterstützt',
    errorFilteringUnspecific: 'Beim Filtern ist was schiefgegangen. Bitte kontaktieren Sie irgendjemanden.',
    errorUnknownOutputDisplayType: 'Unbekannte Ausgabedarstellung',
    errorNotImpl: 'Noch nicht unterstützt',
    errorUnknownParentAttributeType: 'getAttributeValue hat ein unbekanntes Elternattribut angetroffen',
    errorUnknownFilterTransformation: 'Unbekannte Filtertransformation: %s',
    errorUnknownFilterOperator: 'Unbekannter Filteroperator: %s',
    errorMissingFilterOperators: 'Filteroperatoren fehlen noch. Diese müssen angegeben werden!',

    dataTablesLocalization: {
        "sEmptyTable":      "Keine Daten in der Tabelle vorhanden",
        "sInfo":            "_START_ bis _END_ von _TOTAL_ Einträgen",
        "sInfoEmpty":       "Keine Daten vorhanden",
        "sInfoFiltered":    "(gefiltert von _MAX_ Einträgen)",
        "sInfoPostFix":     "",
        "sInfoThousands":   ".",
        "sLengthMenu":      "_MENU_ Einträge anzeigen",
        "sLoadingRecords":  "Wird geladen ..",
        "sProcessing":      "Bitte warten ..",
        "sSearch":          "Suchen",
        "sZeroRecords":     "Keine Einträge vorhanden",
        "oPaginate": {
            "sFirst":       "Erste",
            "sPrevious":    "Zurück",
            "sNext":        "Nächste",
            "sLast":        "Letzte"
        },
        "oAria": {
            "sSortAscending":  ": aktivieren, um Spalte aufsteigend zu sortieren",
            "sSortDescending": ": aktivieren, um Spalte absteigend zu sortieren"
        },
        "select": {
            "rows": {
                "_": "%d Zeilen ausgewählt",
                "0": "",
                "1": "1 Zeile ausgewählt"
            }
        },
        "buttons": {
            "print":    "Drucken",
            "colvis":   "Spalten",
            "copy":     "Kopieren",
            "copyTitle":    "In Zwischenablage kopieren",
            "copyKeys": "Taste <i>ctrl</i> oder <i>\u2318</i> + <i>C</i> um Tabelle<br>in Zwischenspeicher zu kopieren.<br><br>Um abzubrechen die Nachricht anklicken oder Escape drücken.",
            "copySuccess": {
                "_": "%d Spalten kopiert",
                "1": "1 Spalte kopiert"
            }
        }
    }
};