class HypeMan {
    constructor() {
        this.playlist = null;
    }

    async init() {
        Hooks.on("ready", async () => {
            const hypePlaylist = game.playlists.entities.find(p => p.name == HypeMan.DEFAULT_CONFIG.playlistName);
            if(!hypePlaylist) {
                this.playlist = await Playlist.create({"name": HypeMan.DEFAULT_CONFIG.playlistName});
            } else {
                this.playlist = hypePlaylist;
            }

            this._hookOnRenderCharacterSheets();
        });

        Hooks.on("updateCombat", (combat, update) => {
            const actorTrack = combat.combatant.actor.getFlag(HypeMan.DEFAULT_CONFIG.moduleName, HypeMan.DEFAULT_CONFIG.flagNames.track);

            if(update.turn || update.round) {
                this.playlist.stopAll();

                if(actorTrack) {
                    this._playTrack(actorTrack);
                    //this.playlist.playAll();
                }
            }
        });

        
    }

    /**
     * Hooks on render of the default Actor sheet in order to insert the DDB Button
     */
    _hookOnRenderCharacterSheets() {
        const sheetClasses = Object.values(CONFIG.Actor.sheetClasses.character);

        for (let s of sheetClasses) {
            const sheetClass = s.id.split(".")[1];
            Hooks.on(`render${sheetClass}`, (app, html, data) => {
                this._addHypeButton(app, html, data);
            });
        }
    }

    static get DEFAULT_CONFIG() {
        return {
            moduleName: "hype-man",
            playlistName: "Hype Tracks",
            buttonIcon: "fas fa-music",
            buttonText: " Hype",
            aTitle: "Change Actor Theme Song",
            flagNames: {
                track: "track"
            }
        }  
    }

    /**
     * 
     * @param {*} actor
     * 
     */
    async _getActorTrack(actor) {
        let actorTrack;

        try {
            actorTrack = await actor.getFlag(HypeMan.DEFAULT_CONFIG.moduleName, HypeMan.DEFAULT_CONFIG.flagNames.track);
            return actorTrack;
        } catch (e) {
            console.log(e);
            return;
        }

    }
    
    
    async _addHypeButton (app, html, data) {
        /**
         * Finds the header and the close button
         */
        const windowHeader = html.parent().parent().find(".window-header");
        const windowCloseBtn = windowHeader.find(".close");
    
        /**
         * jquery reference to the D&D Beyond button to add to the sheet
         */
        const hypeButton = $(
            `<a class="${HypeMan.DEFAULT_CONFIG.moduleName}" title="${HypeMan.DEFAULT_CONFIG.aTitle}">
                <i class="${HypeMan.DEFAULT_CONFIG.buttonIcon}"></i>
                <span> ${HypeMan.DEFAULT_CONFIG.buttonText}</span>
            </a>`
        );
        
        /**
         * Create an instance of the hypeButton before the close button
         * Removes existing instances first to avoid duplicates
         */
        windowHeader.find('.hype-man').remove();
        windowCloseBtn.before(hypeButton);
    
        /**
         * When the DDB button is clicked, lookup the DDB URL, then look for an existing popup,
         * and if none exists, and the DDB URL is null, open the form to set the URL, 
         * otherwise if the popup does not exist but the DDB URL is not null, create the popup
         * or else simply focus the existing popup
         */
        hypeButton.click(async ev => {
            const actorTrack = await this._getActorTrack(app.entity);
            this._openTrackForm(app.entity, actorTrack, {closeOnSubmit: true});
        });
    }
    
    _openTrackForm(actor, track, options){
        const data = {
            "track": track,
            "playlist": this.playlist
        }
        new HMActorTrackForm(actor, data, options).render(true);
    }

    _getPlaylistSound(trackId) {
        return this.playlist.sounds.find(s => s.id == trackId);
    }

    _playTrack(trackId) {
        //const sound = this._getPlaylistSound(trackId);
        if(!(trackId instanceof Number)) {
            trackId = Number(trackId);
        }

        this.playlist.updateSound({id: trackId, playing: true});
    }
}


class HMActorTrackForm extends FormApplication {
    constructor(actor, data, options){
        super(data, options);
        this.actor = actor;
        this.data = data;
    }
    
    /**
     * Default Options for this FormApplication
     * @todo extract to module constants
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "hype-man-track",
            title: "Character Theme Song",
            template: "public/modules/hype-man/templates/actor-track-form.html",
            classes: ["sheet"],
            width: 500
        });
    }

    /**
     * Provide data (ddbURL if any) to the handlebars template
     */
    async getData() {
        const data = {
            playlistTracks: this.data.playlist.sounds,
            track: this.data.track
        }
        return data;
    }

    /**
     * Executes on form submission.
     * Attempts to set the ddbURL flag on the underlying Actor
     * @param {Object} event -- the form submission event 
     * @param {Object} formData -- the form data
     */
    async _updateObject(event, formData) {
        try {
            this.actor.setFlag(HypeMan.DEFAULT_CONFIG.moduleName, HypeMan.DEFAULT_CONFIG.flagNames.track, formData.track);
        } catch (e) {
            throw e;   
        }
        
    }

}

const hypeMan = new HypeMan();
hypeMan.init();

//on combat turn change,
//if the turn's actor has the flag set
//play the song

//on ready,
//create the hype man playlist,
//if one doesn't exist
