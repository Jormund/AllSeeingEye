// ==UserScript==
// @id             iitc-plugin-AllSeeingEye@Xandrex
// @name           IITC plugin: AllSeeingEye
// @category       Info
// @version        0.5
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @downloadURL    https://cdn.rawgit.com/Jormund/AllSeeingEye/master/AllSeeingEye.user.js
// @description    [2018-02-02] All Seeing Eye
// @include        https://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://ingress.com/intel*
// @match          https://ingress.com/intel*
// @include        http://ingress.com/intel*
// @match          http://ingress.com/intel*
// @grant          none 
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function () { };

    // PLUGIN START ////////////////////////////////////////////////////////

    // use own namespace for plugin
    window.plugin.AllSeeingEye = function () { };
    window.plugin.AllSeeingEye.debug = false; //log more messages if true

    window.plugin.AllSeeingEye.KEY_STORAGE = 'AllSeeingEye-storage';
    window.plugin.AllSeeingEye.EXPORT_TYPE = {
        IITCRAWJSON: {code:'IITCRAWJSON',name:'Raw JSON'  },
        IITCHTML:    {code:'IITCHTML'   ,name:'IITC HTML' },
        TABULAR:     {code:'TABULAR'    ,name:'Tabular'   },
        MU:          {code:'MU'         ,name:'Mind Units'}
    };
    window.plugin.AllSeeingEye.DEFAULT_EXPORT_TYPE = window.plugin.AllSeeingEye.EXPORT_TYPE.MU;
    window.plugin.AllSeeingEye.chatRawData = [];

    window.plugin.AllSeeingEye.storage = {};
    //exportType: window.plugin.AllSeeingEye.DEFAULT_EXPORT_TYPE,

    window.plugin.AllSeeingEye.isSmart = undefined; //will be true on smartphones after setup

    // update the localStorage datas
    window.plugin.AllSeeingEye.saveStorage = function () {
        localStorage[window.plugin.AllSeeingEye.KEY_STORAGE] = JSON.stringify(window.plugin.AllSeeingEye.storage);
    };

    // load the localStorage datas
    window.plugin.AllSeeingEye.loadStorage = function () {
        if (typeof localStorage[window.plugin.AllSeeingEye.KEY_STORAGE] != "undefined") {
            window.plugin.AllSeeingEye.storage = JSON.parse(localStorage[window.plugin.AllSeeingEye.KEY_STORAGE]);
        }

        //ensure default values are always set
                if (typeof window.plugin.AllSeeingEye.storage.exportType == "undefined"
                    || typeof window.plugin.AllSeeingEye.storage.exportType.code == 'undefined'
                    || typeof window.plugin.AllSeeingEye.EXPORT_TYPE[window.plugin.AllSeeingEye.storage.exportType.code] == 'undefined') {
                    window.plugin.AllSeeingEye.storage.exportType = window.plugin.AllSeeingEye.DEFAULT_EXPORT_TYPE;
                }
                else {
                    window.plugin.AllSeeingEye.storage.exportType = window.plugin.AllSeeingEye.EXPORT_TYPE[window.plugin.AllSeeingEye.storage.exportType.code];
                }
    };

    /***************************************************************************************************************************************************************/
    /** get log **************************************************************************************************************************************************/
    /***************************************************************************************************************************************************************/
    window.plugin.AllSeeingEye.extractClicked = function () {
        let options = {
            exportType: window.plugin.AllSeeingEye.storage.exportType
        };
        window.plugin.AllSeeingEye.extractAndDisplay(options);
    };

    // toggle player selection (all lines) within the table -------------------
    window.plugin.AllSeeingEye.togglePlayer = function (myPlayerName) {
        //console.log ('togglePlayer : start' + myPlayerName + '--');
        let linesCardinal = document.getElementsByClassName('sumXDX').length;
        let myBox;
        let mySum=0;
        let myGlobalToggle;
        for (let i=0 ; i<linesCardinal ; i++) {
            myBox = document.getElementById('checkboxXDX'+i);
            // test if line relevant to the user
            //console.log (i+':'+myBox.parentNode.nextSibling.innerHTML);
            if (myPlayerName == myBox.parentNode.nextSibling.innerHTML) {
                //console.log (myBox.parentNode.nextSibling.innerHTML);
                if (undefined===myGlobalToggle) {
                    myGlobalToggle = !(myBox.checked);
                } // END IF
                myBox.checked = myGlobalToggle;
            }
            // END IF
        } // END FOR
        window.plugin.AllSeeingEye.doSUM();
    };
    // end function

    // sums MU for all lines in the table -------------------------------------
    window.plugin.AllSeeingEye.doSUM = function () {
        //console.log ('calling doSUM');
        let linesCardinal = document.getElementsByClassName('sumXDX').length;
        let myBox;
        let mySum=0;
        for (let i=0 ; i<linesCardinal ; i++) {
            myBox = document.getElementById('checkboxXDX'+i);
            if (myBox.checked) {
                mySum += Number ( myBox.parentNode.nextSibling.nextSibling.innerHTML.replace('+','') );
            }
        }
        document.getElementById('totalXDX').innerHTML = (mySum+'').replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1&apos;') ;
        // add thousands seperator
    };

    // where the action takes place ! -----------------------------------------
    window.plugin.AllSeeingEye.extractAndDisplay = function (options) {
        if (typeof options == 'undefined') options = {};
        if (typeof options.exportType == 'undefined') options.type = window.plugin.AllSeeingEye.DEFAULT_EXPORT_TYPE;

        try {
            window.plugin.AllSeeingEye.log('Start of extract log');
            var msg = '';
            let html = '';
            let htmlTable = ''; // XDX for MU

            if      (options.exportType == window.plugin.AllSeeingEye.EXPORT_TYPE.IITCRAWJSON) {
                html = JSON.stringify(window.plugin.AllSeeingEye.chatRawData);
            }
            else if (options.exportType == window.plugin.AllSeeingEye.EXPORT_TYPE.IITCHTML   ) {
                $.each(window.chat._public.data, function (index, chatLine) {
                    //html+= '\r\n'+chatLine[0]+' '+chatLine[1]+' '+chatLine[2];
                    html+= '\r\n'+chatLine[2];
                });
            }
            else if (options.exportType == window.plugin.AllSeeingEye.EXPORT_TYPE.TABULAR    ) {
                html = 'GUID'+
                            '\tTimestamp'+
                            '\tDate'+
                            '\tPlayer name'+
                            '\tPlayer team'+
                            '\tAuthor type'+
                            '\tSender'+
                            '\tIs secure'+
                            '\tMU'+
                            '\tAction'+
                            '\tFull text'+
                            '';
                $.each(window.plugin.AllSeeingEye.chatRawData, function (index, chatDataBlock) {
                    $.each(chatDataBlock.result, function (index, chatLine) {
                        //html+= '\r\n'+chatLine[0]+' '+chatLine[1]+' '+chatLine[2];
                        var guid = chatLine[0];
                        var timestamp = chatLine[1];
                        var messageDate = new Date(timestamp);
                        var stringDate = messageDate.toString();
                        var UTCStringDate = messageDate.toUTCString();
                        var IITCformatedDateTime = unixTimeToDateTimeString(timestamp, true);//unixTimeToDateTimeString defined in IITC
                        var plext = chatLine[2].plext;
                        var fullText = plext.text;
                        var markups = plext.markup;
                        var player = {};
                        var sender = {};
                        var atPlayer = {};
                        var actionText = '';
                        var MU = '';
                        var portals = [];
                        var sender = {};
                        var authorType = plext.plextType;//SYSTEM_BROADCAST ou PLAYER_GENERATED
                        var isSecure = false;
                        var isNumberRegex = /^\-?\d+$/;
                        var extractMURegex = /\-?\d+(?= MU)/;
                        if(extractMURegex.test(fullText)){
                           MU =  extractMURegex.exec(fullText)[0];
                        }

                        $.each(markups, function(ind, markup) {
                            switch(markup[0]) {
                                  case 'SENDER': // user generated messages
                                    sender.name = markup[1].plain.slice(0, -2); // cut “: ” at end
                                    break;

                                  case 'PLAYER': // automatically generated messages
                                    player.name = markup[1].plain;
                                    player.team = markup[1].team;
                                    //player 2 when attack alert ??
                                    break;

                                  case 'TEXT':
                                    // detect all parts
//                                    if(isNumberRegex.test(markup[1].plain)){
//                                        MU = markup[1].plain;//if number then it's MU
//                                    }
//                                    else if(actionText == '') {
//                                        actionText = markup[1].plain; //msg += $('<div/>').text(markup[1].plain).html().autoLink();
//                                    }
                                    //else

                                    break;

                                  case 'AT_PLAYER':// handle this one day
//                                    var thisToPlayer = (markup[1].plain == ('@'+window.PLAYER.nickname));
//                                    var spanClass = thisToPlayer ? "pl_nudge_me" : (markup[1].team + " pl_nudge_player");
//                                    var atPlayerName = markup[1].plain.replace(/^@/, "");
//                                    msg += $('<div/>').html($('<span/>')
//                                                      .attr('class', spanClass)
//                                                      .attr('onclick',"window.chat.nicknameClicked(event, '"+atPlayerName+"')")
//                                                      .text(markup[1].plain)).html();
//                                    msgToPlayer = msgToPlayer || thisToPlayer;
                                    break;

                                  case 'PORTAL':
                                    var portal = {};
                                    portal.latE6 = markup[1].latE6;
                                    portal.lngE6 = markup[1].lngE6;
                                    portal.lat = portal.latE6/1E6;
                                    portal.lng = portal.latE6/1E6;
                                    portal.name = markup[1].name;
                                    portal.address = markup[1].address;
                                    portal.team = markup[1].team;
                                    portal.plain = markup[1].plain;
                                    break;

                                  case 'SECURE':
                                    //NOTE: we won't add the '[secure]' string here - it'll be handled below instead
                                    isSecure = true;
                                    break;

                                  default:
                                    //handle unknown types by outputting the plain text version, marked with it's type
                                    //msg += $('<div/>').text(markup[0]+':<'+markup[1].plain+'>').html();
                                    break;
                            }
                            // END SWITCH
                        });
                        // END EACH
                        html+= '\r\n'+guid+
                                '\t'+timestamp+
                                '\t'+IITCformatedDateTime+
                                '\t'+(player.name||'')+
                                '\t'+(player.team||'')+
                                '\t'+authorType+
                                '\t'+(sender.name||'')+
                                '\t'+isSecure+
                                '\t'+MU+
                                '\t'+actionText+
                                '\t'+fullText+
                                '';
                    });
                });
            }
            else if(options.exportType == window.plugin.AllSeeingEye.EXPORT_TYPE.MU) {
                html =  'Date'+
                            '\tPlayer name'+
                            '\tMU'+
                            '\tFull text'+
                            '';

                let tableRowNumber = 0; // XDX
                let previousguid = 'aaa'; // XDX init comparaison doublon de GUID
                $.each(window.plugin.AllSeeingEye.chatRawData, function (index, chatDataBlock) {
                    $.each(chatDataBlock.result, function (index, chatLine) {

                        let guid = chatLine[0];
                        if (previousguid!=guid) { // compare if doublon de log
                            previousguid=guid;
                            //var sender = {};
                            //var atPlayer = {};
                            //var actionText = '';
                            //var portals = [];
                            //var isNumberRegex = /^\-?\d+$/;

                            let timestamp = chatLine[1];
                            //let messageDate = new Date(timestamp);
                            //let stringDate = messageDate.toString();
                            //let UTCStringDate = messageDate.toUTCString();

                            let IITCformatedDateTime = unixTimeToDateTimeString(timestamp, true);//unixTimeToDateTimeString defined in IITC
                                IITCformatedDateTime = IITCformatedDateTime.substring(11);
                            let plext = chatLine[2].plext;
                            //let authorType = plext.plextType;//SYSTEM_BROADCAST ou PLAYER_GENERATED
                            let fullText = plext.text;
                            let markups = plext.markup;
                            let player = {};
                            let MU = 'bbbb';
                            let playerColour=''; // XDX

                            // keep lines only for MUs actions (create or destroy Control Field) // XDX
                            let extractMURegex = /[-+]\d+(?= MU)/; // XDX keep sign at all times
                            if (extractMURegex.test(fullText)) {

                                console.log (chatLine);
                                MU =  extractMURegex.exec(fullText)[0];

                                $.each(markups, function(ind, markup) {
                                    if ('PLAYER' == markup[0]) {
                                            player.name = markup[1].plain;
                                            player.team = markup[1].team;
                                    } // END IF
                                });

                                // if other faction gains MUs, it does not concern our operation
                                // operation can be concerned in the three following cases:
                                //  - a faction member gains MU by creating a faction CF
                                //  - a faction member loses MU by destroying a faction CF using a virus
                                //  - an opposite faction member lowers MU by destroying a faction CF
                                //if ( !( (player.team!= window.PLAYER.team) && (-1 != MU.indexOf('+')) ) ) {

                                    fullText = fullText.replace(/.*Control Field @([^(]*).*/,'$1'); // XDX shorten the full text
                                    console.log ('a:'+fullText);
                                    fullText = fullText.replace(/ /g,'&nbsp;');
                                    console.log ('z:'+fullText);
                                    playerColour = ('RESISTANCE'==player.team ? '#0088FF' : '#03DC03');  // XDX hardcoded colours from official chat

                                    html+=
                                         '\r\n'
                                        +''  +IITCformatedDateTime
                                        +'\t'+player.name
                                        +'\t'+MU
                                        +'\t'+fullText
                                        +'';

                                    // create the table line, in reverse.
                                    htmlTable =
                                         "\n<tr>"
                                        +'<td>'+IITCformatedDateTime+'</td>'
                                        +'<td><input class="sumXDX" id="checkboxXDX'+tableRowNumber+'" type="checkbox" checked="checked" onclick="window.plugin.AllSeeingEye.doSUM();"/></td>'
                                        +'<td style="color:'+playerColour+'" onclick="window.plugin.AllSeeingEye.togglePlayer(\''+player.name+'\');">'+player.name+'</td>'
                                        +'<td style="text-align:right;">'+MU+'</td>'
                                        +'<td>'+fullText+'</td>'
                                        +'</tr>'
                                        + "\n"+htmlTable;
                                    tableRowNumber++;
                                //} // END IF
                                // END IF ( !( (player.team!= window.PLAYER.team) && (-1 != MU.indexOf('+')) ) ) {
                            }
                            // END IF (extractMURegex.test(fullText)){
                        }
                        // END IF compare doublon de GUID
                        
                    });
                    // END FUNCTION $.each(chatDataBlock.result, function (index, chatLine) {

                });
                // END FUNCTION $.each(window.plugin.AllSeeingEye.chatRawData, function (index, chatDataBlock) {

                htmlTable =
                     '<hr /><form id="formXDX">'
                    +'    <table summary="lala" id="table1" style="border: solid blue 1px;">'
                    +'        <thead>'
                    +'            <tr>'
                    +'                <th style="color:#FFCE00;">Time</th>'
                    +'                <th style="color:#FFCE00;">I.</th>'
                    +'                <th style="color:#FFCE00;">Agent</th>'
                    +'                <th style="color:#FFCE00;">MUs</th>'
                    +'                <th style="color:#FFCE00;">Portal</th>'
                    +'            </tr>'
                    +'        </thead>'
                    +'        <tbody>'
                    + htmlTable
                    + '        </tbody>'
                    +'    </table>'
                    +'</form>'
                    +'<div>'
                    +'    <span>Total Mind Units:&nbsp;</span>'
                    +'    <span id="totalXDX">-999999</span>'
                    +'</div><hr />'
                    +'<script type="text/javascript">'
                    +'    window.plugin.AllSeeingEye.doSUM();'
                    +'</script>';
                    ;
                    /*
                    */

            }
            // END else if(options.exportType == window.plugin.AllSeeingEye.EXPORT_TYPE.MU) {
            else {
                html+= 'Export type is undefined';
            }

            html = '<textarea>' + html + '</textarea>';
            html = html + htmlTable; // XDX

            dialog({
                  html :html
                , id   :'AllSeeingEye_result'
                , title:'The All Seeing Eye'
                , width:501 // XDX
            });

            window.plugin.AllSeeingEye.log('End of extract log');
        }
        catch (err) {
            if (window.plugin.AllSeeingEye.isSmart)
                window.plugin.AllSeeingEye.log(err.stack, true);
            else
                throw err;
        }
    };
    /***************************************************************************************************************************************************************/
    //Options//
    /*********/
    window.plugin.AllSeeingEye.resetOpt = function () {
        window.plugin.AllSeeingEye.storage.exportType = window.plugin.AllSeeingEye.DEFAULT_EXPORT_TYPE;
        window.plugin.AllSeeingEye.saveStorage();
        window.plugin.AllSeeingEye.openOptDialog();
    };

    window.plugin.AllSeeingEye.saveOpt = function () {
        var exportType = $('#AllSeeingEye-exportType').val();
        if(typeof window.plugin.AllSeeingEye.EXPORT_TYPE[exportType] != 'undefined') {
            exportType = window.plugin.AllSeeingEye.EXPORT_TYPE[exportType];
            window.plugin.AllSeeingEye.storage.exportType = exportType;
        }
        window.plugin.AllSeeingEye.saveStorage();
    };

    window.plugin.AllSeeingEye.optClicked = function () {
        window.plugin.AllSeeingEye.openOptDialog();
    };

    window.plugin.AllSeeingEye.openOptDialog = function () {

        var html =
        '<div>' +
            '<table>';
                html +=
                    '<tr>' +
                        '<td>' +
                            'Format' +
                        '</td>' +
                        '<td>' +
                            '<select id="AllSeeingEye-exportType">';
                            for(typeCode in window.plugin.AllSeeingEye.EXPORT_TYPE){
                                var type = window.plugin.AllSeeingEye.EXPORT_TYPE[typeCode];
                                html+= '<option value="'+type.code+'" '+
                                    (window.plugin.AllSeeingEye.storage.exportType == type ? 'selected="selected" ' : '') +
                                    '>' + type.name+'</option>';
                            }
                html += '</select>'+
                        '</td>' +
                    '</tr>';
        html +=
            '</table>' +
        '</div>'
        ;

        dialog({
            html: html,
            id: 'AllSeeingEye_opt',
            title: 'Extract log preferences',
            width: 'auto',
            buttons: {
                'Reset': function () {
                    window.plugin.AllSeeingEye.resetOpt();
                },
                'Save': function () {
                    window.plugin.AllSeeingEye.saveOpt();
                    $(this).dialog('close');
                }
            }
        });
    };

    /***************************************************************************************************************************************************************/
    window.plugin.AllSeeingEye.clearLog = function () {
        if (window.plugin.AllSeeingEye.isSmart) {
            $('#AllSeeingEye-log').html();
        }
    };

    window.plugin.AllSeeingEye.log = function (text, isError) {
        if (window.plugin.AllSeeingEye.debug || isError) {
            if (window.plugin.AllSeeingEye.isSmart) {
                $('#AllSeeingEye-log').prepend(text + '<br/>');
            }
            else {
                console.log (text);
            }
        }
    };

    /***************************************************************************************************************************************************************/

    var setup = function () {
        window.plugin.AllSeeingEye.isSmart = window.isSmartphone();
        window.plugin.AllSeeingEye.loadStorage();

        // toolbox menu
        $('#toolbox').after('<div id="AllSeeingEye-toolbox" style="padding:3px;"></div>');
        var elToolbox = $('#AllSeeingEye-toolbox');
        elToolbox.append(' <strong>Extract log : </strong>');
        elToolbox.append('<a onclick="window.plugin.AllSeeingEye.extractClicked()" title="Extract log">Extract</a>&nbsp;&nbsp;');
        elToolbox.append('<a onclick="window.plugin.AllSeeingEye.optClicked()"     title="Preferences">Opt</a>&nbsp;&nbsp;');
        if (window.plugin.AllSeeingEye.isSmart) {
            $('#AllSeeingEye-toolbox').append('<div id="AllSeeingEye-log"></div>');
        }
        window.addHook('publicChatDataAvailable', function (data) {
            window.plugin.AllSeeingEye.chatRawData.push(data.raw);
        });
    };
    // PLUGIN END //////////////////////////////////////////////////////////

    setup.info = plugin_info; //add the script info data to the function as a property
    if (!window.bootPlugins) {
        window.bootPlugins = [];
    }

    window.bootPlugins.push(setup);

    // if IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') {
        setup();
    }
}
// wrapper end

// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
    info.script = {  version: GM_info.script.version
                   , name: GM_info.script.name
                   , description: GM_info.script.description
                  };
}

script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(info) + ');'));

(document.body || document.head || document.documentElement).appendChild(script);
