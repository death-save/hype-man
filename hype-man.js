class HypeMan {
    constructor() {
        this.playlist = null;
    }

    init() {
        Hooks.on("ready", () => {
            const playlist = "Hype Man"
            if(!game.playlists.entities.find(p => p.name == playlist)) {
                return this.playlist = Playlist.create({"name": playlist});
            }
        });

        Hooks.on("updateCombat", (combat, update) => {
            const actorTrack = combat.combatant.actor.getFlag(HypeMan.DEFAULT_CONFIG.moduleName, HypeMan.DEFAULT_CONFIG.flagNames.trackPath);

            if(actorTrack && actorTrack.length > 0) {
                HypeMan._playTrack(actorTrack);
            }
        });

        Hooks.on("renderActorSheet", (app, html, data) => {
            this._addhypeButton(app, html, data);
        });
    }

    static get DEFAULT_CONFIG() {
        return {
            moduleName: "hype-man",
            buttonIcon: "fas fa-music",
            buttonText: " Hype",
            aTitle: "Change Actor Theme Song",
            flagNames: {
                trackPath: "trackPath"
            }
        }  
    }

    /**
     * 
     * @param {*} actor
     * @todo change to dropdown list looking in the hypeman playlist, store a reference to the sound id instead of the path
     * 
     */
    async _getActorTrack(actor) {
        let actorTrackPath;

        try {
            actorTrackPath = await actor.getFlag(HypeMan.DEFAULT_CONFIG.moduleName, HypeMan.DEFAULT_CONFIG.flagNames.trackPath);
            return actorTrackPath;
        } catch (e) {
            console.log(e);
            return;
        }

    }
    
    
    async _addhypeButton (app, html, data) {
        /**
         * Finds the header and the close button
         */
        const windowHeader = html.parent().parent().find(".window-header");
        const windowCloseBtn = windowHeader.find(".close");
    
        /**
         * jquery reference to the D&D Beyond button to add to the sheet
         */
        const hypeButton = $(
            `<a class=${HypeMan.DEFAULT_CONFIG.moduleName} title=${HypeMan.DEFAULT_CONFIG.aTitle}>
                <i class=${HypeMan.DEFAULT_CONFIG.buttonIcon}></i>
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
            const actorThemePath = await this._getActorTrack(app.entity);
            this._openTrackForm(app.entity, actorThemePath, data, {closeOnSubmit: true});
        });
    }
    
    _openTrackForm(actor, trackPath, data, options){
        new HMActorTrackForm(actor, trackPath, data, options).render();
    }

    static _getPlaylistSound(track) {
        this.playlist.sounds.find(s => s.id == track.id);
    }

    static _playTrack(track) {
        const sound = HypeMan._getPlaylistSound(track);

        this.playlist.playSound(sound);
    }
}


class HMActorTrackForm extends FormApplication {
    constructor(actor, actorTrackPath, data, options){
        super(data, options);
        this.actor = actor;
        this.data = data;
        this.trackPath = actorTrackPath;
    }
    
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "hype-man-track",
            title: "Character Theme Song",
            template: "public/modules/ddb-popper/template/actor-track-form.html",
            classes: ["sheet"],
            width: 500
        });
    }

    /**
     * Provide data (ddbURL if any) to the handlebars template
     */
    async getData() {
        const data = {
            trackPath: this.trackPath
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
            this.actor.setFlag(HypeMan.DEFAULT_CONFIG.moduleName, HypeMan.DEFAULT_CONFIG.flagNames.trackPath, formData.trackPath);
        } catch (e) {
            throw e;   
        }
        
    }

}

//on combat turn change,
//if the turn's actor has the flag set
//play the song

//on ready,
//create the hype man playlist,
//if one doesn't exist
