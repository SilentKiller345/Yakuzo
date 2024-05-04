const { EventEmitter } = require('events');
const { Shoukaku } = require('shoukaku');
const Player = require('./Player');
const Spotify = require('./module/Spotify');

class Shunko extends EventEmitter {
	/**
	 * @param {*} client
	 * @param {import('shoukaku').NodeOption[]} nodes
	 * @param {ShunkoOptions} options
	 */
	constructor(options, connector) {
		super();

		if (typeof options !== 'object') return console.log("[Shunko] => ShunkoOptions must be an object");
		if (!options.nodes) return console.log('[Shunko] => ShunkoOptions must contain a nodes property');
		if (!Array.isArray(options.nodes)) return console.log('[Shunko] => ShunkoOptions.nodes must be an array');
		if (options.nodes.length === 0) return console.log('[Shunko] => ShunkoOptions.nodes must contain at least one node');
		if (!options.shoukakuoptions) return console.log('[Shunko] => ShunkoOptions must contain a shoukakuoptions property');
		if (options?.spotify) {
			if (!options.spotify[0]?.ClientID) return console.log('[Shunko] => ShunkoOptions.spotify must have ClientID');
			if (!options.spotify[0]?.ClientSecret) return console.log('[Shunko] => ShunkoOptions.spotify must have ClientSecret');

			if (options.spotify?.length === 1) {
				this.spotify = new Spotify({ ClientID: options.spotify[0]?.ClientID, ClientSecret: options.spotify[0]?.ClientSecret });
			} else {
				for (const client of options.spotify) { this.spotify = new Spotify(client); }
				console.warn("[Shunko Spotify] => You are using the multi client mode, sometimes you can STILL GET RATE LIMITED.");
			}
		}
		this.shoukaku = new Shoukaku(connector, options.nodes, options.shoukakuoptions);
		this.players = new Map();
		this.defaultSearchEngine = options?.defaultSearchEngine || 'youtube';
	}

	/**
	 * Create a new player.
	 * @param {ShunkoCreatePlayerOptions} options
	 * @returns {Promise<Player>}
	 */
	async createPlayer(options) {
		const existing = this.players.get(options.guildId);
		if (existing) return existing;

		let node;
		if (options.loadBalancer === true) {
			node = this.getLeastUsedNode();
		} else { 
			node = this.shoukaku.options.nodeResolver(this.shoukaku.nodes)
		}
		if (node === null) return console.log('[Shunko] => No nodes are existing.');

		const ShoukakuPlayer = await this.shoukaku.joinVoiceChannel({
			guildId: options.guildId,
			channelId: options.voiceId,
			shardId: options.shardId,
			deaf: options.deaf || true
		});

		const ShunkoPlayer = new Player(this, {
			guildId: options.guildId,
			voiceId: options.voiceId,
			textId: options.textId,
			volume: `${options.volume}` || '80',
			ShoukakuPlayer
		});
		this.players.set(options.guildId, ShunkoPlayer);
		this.emit('PlayerCreate', ShunkoPlayer);
		return ShunkoPlayer;
	}

	getLeastUsedNode() {
		const nodes = [...this.shoukaku.nodes.values()];
		const onlineNodes = nodes.filter((node) => node);
		if (!onlineNodes.length) return console.log("[Shunko] => No nodes are online.")
		return onlineNodes.reduce((a, b) => (a.players.size < b.players.size ? a : b));
	}


	/**
	* Resolve a track
	* @param {shoukaku.Track} track
	* @returns {Promise<shoukaku.Track>}
	*/
	async resolve(track, node) {
		const query = [track.info.author, track.info.title].filter(x => !!x).join(' - ');
		let result = await node.rest.resolve(`ytmsearch:${query}`);
		if (!result || !result.tracks.length) {
			result = await node.rest.resolve(`ytsearch:${query}`);
			if (!result || !result.tracks.length) return;
		}
		console.log(result)
		track.track = result.tracks[0].track;
		return track;
	}

	/**
	 * Search a song in Lavalink providers.
	 * @param {string} query
	 * @param {ShunkoSearchOptions} options
	 * @returns {Promise<shoukaku.LavalinkResponse>}
	 */
	async search(query, options = { engine: this.defaultSearchEngine }) {
		if (/^https?:\/\//.test(query)) {
			if (options.engine === 'ShunkoSpotify') {
				if (this.spotify.check(query)) {
					return await this.spotify.resolve(query, options.requester);
				}
				return await this.shoukaku.getNode()?.rest.resolve(query, options.requester);
			}
			return await this.shoukaku.getNode()?.rest.resolve(query, options.requester);
		}
		if (options.engine === 'ShunkoSpotify') return await this.spotify.search(query, options.requester);
		const engineMap = {
			youtube: 'ytsearch',
			youtubemusic: 'ytmsearch',
			soundcloud: 'scsearch',
			spotify: 'spsearch',
			deezer: "dzsearch",
			yandex: 'ymsearch'
		};
		return await this.shoukaku.getNode()?.rest.resolve(`${engineMap[options.engine]}:${query}`);
	}

	/**
	 * Add a listener to a event.
	 * @template {keyof ShunkoEvents} K
	 * @param {K} event
	 * @param {(...args: ShunkoEvents[K]) => any} listener
	 * @returns {Shunko}
	 */
	on(event, listener) {
		super.on(event, listener);
		return this;
	}

	get(guildId) {
		return this.players.get(guildId);
	  }

	/**
	 * Add a "unique" listener to an event.
	 * @template {keyof ShunkoEvents} K
	 * @param {K} event
	 * @param {(...args: ShunkoEvents[K]) => any} listener
	 * @returns {Shunko}
	 */
	once(event, listener) {
		super.once(event, listener);
		return this;
	}
}

module.exports = Shunko;

/**
 * @typedef ShunkoOptions
 * @property {ShunkoSpotifyOptions} [spotify]
 */

/**
 * @typedef ShunkoSpotifyOptions
 * @property {number} playlistLimit
 * @property {number} albumLimit
 * @property {number} artistLimit
 * @property {string} searchMarket
 * @property {string} clientID
 * @property {string} clientSecret
 */

/**
 * @typedef ShunkoCreatePlayerOptions
 * @prop {string} guildId
 * @prop {string} voiceId
 * @prop {string} textId
 * @prop {number} shardId
 * @prop {number} [volume]
 * @prop {boolean} [deaf]
 */

/**
 * @typedef ShunkoSearchOptions
 * @prop {'ytsearch' | 'ytmsearch' | 'spsearch' | 'scsearch'} [engine]
 */

/**
 * @typedef ShunkoEvents
 * @prop {[player: Player, track: shoukaku.Track]} trackStart
 * @prop {[player: Player, track: shoukaku.Track]} trackEnd
 * @prop {[player: Player]} queueEnd
 * @prop {[player: Player, data: shoukaku.WebSocketClosedEvent]} PlayerClosed
 * @prop {[player: Player, data: shoukaku.TrackExceptionEvent]} trackException
 * @prop {[player: Player, data: shoukaku.PlayerUpdate]} PlayerUpdate
 * @prop {[player: Player, data: shoukaku.TrackStuckEvent]} trackStuck
 * @prop {[player: Player]} PlayerResumed
 * @prop {[player: Player]} playerDestroy
 * @prop {[player: Player]} playerCreate
 */