Hooks.on("updateCombat", (combat, update) => {
    if(update.turn.token.actor.isPC && update.turn.token.actor.flags["hype-man"]["track"]) {
        let song = new Howl();
    }
})

//add tracks to actors as flags

//on combat turn change,
//if the turn's actor has the flag set
//play the song

//on ready,
//create the hype man playlist,
//if one doesn't exist
Hooks.on("ready", () => {
    const playlist = "Hype Man"
    if(!game.playlists.find(p => p.name == playlist)) {
        Playlist.create({"name": playlist});
    }
})