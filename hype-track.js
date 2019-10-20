class HypeTrack {
    constructor() {
        this.playlist = null;
    }

    async init() {
        Hooks.on("ready", async () => {
            if(!game.user.isGM) return;

            const hypePlaylist = game.playlists.entities.find(p => p.name == HypeTrack.DEFAULT_CONFIG.playlistName);
            if(!hypePlaylist) {
                this.playlist = await Playlist.create({"name": HypeTrack.DEFAULT_CONFIG.playlistName});
            } else {
                this.playlist = hypePlaylist;
            }

            this._hookOnRenderCharacterSheets();
        });

        Hooks.on("updateCombat", (combat, update) => {

            if(update.turn || update.round) {
                const actorTrack = combat.combatant.actor.getFlag(HypeTrack.DEFAULT_CONFIG.moduleName, HypeTrack.DEFAULT_CONFIG.flagNames.track);

                this.playlist.stopAll();

                if(actorTrack) {
                    this._playTrack(actorTrack);
                }
            }
        });

        
    }

    /**
     * Hooks on render of the default Actor sheet in order to insert the DDB Button
     */
    _hookOnRenderCharacterSheets() {
        if(!game.user.isGM) return;
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
            moduleName: "hype-track",
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
            actorTrack = await actor.getFlag(HypeTrack.DEFAULT_CONFIG.moduleName, HypeTrack.DEFAULT_CONFIG.flagNames.track);
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
            `<a class="${HypeTrack.DEFAULT_CONFIG.moduleName}" title="${HypeTrack.DEFAULT_CONFIG.aTitle}">
                <i class="${HypeTrack.DEFAULT_CONFIG.buttonIcon}"></i>
                <span> ${HypeTrack.DEFAULT_CONFIG.buttonText}</span>
            </a>`
        );
        
        /**
         * Create an instance of the hypeButton before the close button
         * Removes existing instances first to avoid duplicates
         */
        windowHeader.find('.hype-track').remove();
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
        new HTActorTrackForm(actor, data, options).render(true);
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


class HTActorTrackForm extends FormApplication {
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
            id: "hype-track-form",
            title: "Character Theme Song",
            template: "public/modules/hype-track/templates/hype-track-form.html",
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
            this.actor.setFlag(HypeTrack.DEFAULT_CONFIG.moduleName, HypeTrack.DEFAULT_CONFIG.flagNames.track, formData.track);
        } catch (e) {
            throw e;   
        }
        
    }

}

const hypeTrack = new HypeTrack();
hypeTrack.init();