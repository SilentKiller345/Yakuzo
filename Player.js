const Queue = require('./Queue');
const Shunko = require('./Shunko');
const shoukaku = require('shoukaku');
const Filters = require('./Filters');

class Player {
	/**
	 *
	 * @param {Shunko} manager
	 * @param {PlayerOptions} options
	 */

	constructor(manager, options) {
		/** @type {Shunko} */
		this.manager = manager;
		
		/** @type {string} */
		this.guildId = options.guildId;

		/** @type {string} */
		this.voiceId = options.voiceId;

		/** @type {string} */
		this.textId = options.textId;

		/** @type {number} */
		this.volume = options.volume;

		/** @type {shoukaku.Player} */
		this.shoukaku = options.ShoukakuPlayer;

		/** @type {Queue} */
		this.queue = new Queue();

		/** @type {boolean} */
		this.paused = false;

		/** @type {boolean} */
		this.playing = false;

		/** @type {Map<any, any>} */
		this.data = new Map();

		/** @type {LoopType} */

		this.node = this.shoukaku.node;

		this.node.isConnected = this.node.state === 1;

		this.filters = new Filters(this.guildId, this.shoukaku.node)

		this.trackRepeat = null;

		this.queueRepeat = null;

		this.nowPlayingMessage = null;
		  
		this.musicMessage = null;

		this.setNowplayingMessage = this.shoukaku.setNowplayingMessage;

		this.setMusicMessage = this.shoukaku.setMusicMessage;

		this.position = this.shoukaku.position;
	
		this[247] = false;

		this.loop = "none";

		this.loop_1 = 0;

		this.shoukaku.on('start', () => {
			this.playing = true;
			this.manager.emit('trackStart', this, this.queue.current);
		});
		this.shoukaku.on('end', () => {
			if (this.loop === "track" && this.queue.current) this.queue.unshift(this.queue.current);
			if (this.loop === "queue" && this.queue.current) this.queue.push(this.queue.current);

			this.queue.previous = this.queue.current;
			const current = this.queue.current;
			this.queue.current = null;

			if (this.queue.length) {
				this.manager.emit('trackEnd', this, current);
			} else {
				this.playing = false;
				return this.manager.emit('queueEnd', this);
			}
			this.play();
		});
		this.shoukaku.on('closed', (data = WebSocketClosedEvent) => {
			this.playing = false;
			this.manager.emit('PlayerClosed', this, data);
		});
		this.shoukaku.on('exception', (data = TrackExceptionEvent) => {
			this.playing = false;
			this.manager.emit('trackException', this, data);
		});
		this.shoukaku.on('update', (data) => {
		 this.manager.emit('PlayerUpdate', this, data)
		 this.position = data.state.position;
		 this.ping = data.state.ping;
		})

		this.shoukaku.on('stuck', (data = TrackStuckEvent) => this.manager.emit('trackStuck', this, data));
		this.shoukaku.on('resumed', () => this.manager.emit('PlayerResumed', this));
	}

	/**
	 * Pause or resume the player
	 * @param {boolean} [pause]
	 * @returns {Player}
	 */
	pause(pause = true) {
		if (typeof pause !== 'boolean') throw new RangeError('[Shunko] => Pause function must be pass with boolean value.');
		if (this.paused === pause || !this.queue.totalSize) return this;
		this.paused = pause;
		this.playing = !pause;
		this.shoukaku.setPaused(pause);
		return this;
	}
	/**
	 * Skip the current track
	 * @returns {Player}
	 */

	skip() {
		this.shoukaku.stopTrack();
		return this;
	}

	/**
	 * Seek to specific time
	 * @param {number} position time in ms
	 * @returns {Player}
	 */
	seekTo(position) {
		if (Number.isNaN(position)) throw new RangeError('[Shunko] => seek Position must be a number.');
		this.shoukaku.seekTo(position);
		return this;
	}

	/**
	 * Set the volume
	 * @param {number} volume
	 * @returns {Player}
	 */
	setVolume(volume) {
		if (Number.isNaN(volume)) throw new RangeError('[Shunko] => Volume level must be a number.');
		this.shoukaku.setVolume(volume / 100);
		this.volume = volume;
		return this;
	}

	/**
	 * Change player's text channel
	 * @param {string} textId
	 * @returns {Player}
	 */
	setTextChannel(textId) {
		if (typeof textId !== 'string') throw new RangeError('[Shunko] => textId must be a string.');
		this.textId = textId;
		return this;
	}

	/**
	 * Change player's voice channel
	 * @param {string} voiceId
	 * @returns {Player}
	 */
	setVoiceChannel(voiceId) {
		if (typeof voiceId !== 'string') throw new RangeError('[Shunko] => voiceId must be a string.');
		this.voiceId = voiceId;
		return this;
	}

	/**
	 * Change the player's loop mode
	 * @param {LoopType} method
	 * @returns {Player}
	 */
	
	/**
	 * Search a song in Lavalink providers.
	 * @param {string} query
	 * @param {Shunko.ShunkoSearchOptions} options
	 * @returns {Promise<shoukaku.LavalinkResponse>}
	 */
	async search(query, options = { engine: this.manager.defaultSearchEngine }) {
		if (/^https?:\/\//.test(query)) {
			if (options.engine === 'ShunkoSpotify') {
				if (this.manager.spotify.check(query)) {
				    return await this.manager.spotify.resolve(query);
				}
				return await this.shoukaku.node.rest.resolve(query);
			}
			return await this.shoukaku.node.rest.resolve(query);
		}
		if (options.engine === 'ShunkoSpotify') return await this.manager.spotify.search(query);
		const engineMap = {
			youtube: 'ytsearch',
			youtubemusic: 'ytmsearch',
			soundcloud: 'scsearch',
			spotify: 'spsearch',
			deezer: "dzsearch",
			yandex: 'ymsearch'
		};
		return await this.shoukaku.node.rest.resolve(`${engineMap[options.engine]}:${query}`);
	}

	/**
	 * Play the queue
	 * @returns {Promise<void>}
	 */
	async play() {
		if (!this.queue.length) return;
		this.queue.current = this.queue.shift();
		try {
			if (!this.queue.current.track) this.queue.current = await this.manager.resolve(this.queue.current, this.shoukaku.node);
			this.shoukaku
				.setVolume(this.volume / 100)
				.playTrack({ track: this.queue.current.track });
		} catch (e) {
			this.manager.emit('trackError', this, this.queue.current, e);
		}
	}

	/**
	 * Disconnect the player
	 * @returns {void}
	 */
	disconnect() {
		this.pause(true);
		const data = {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: null,
                self_mute: false,
                self_deaf: false,
            },
        };
        const guild = this.manager.shoukaku.connector.client.guilds.cache.get(this.guildId);
        if (guild) guild.shard.send(data);
        this.voiceId = null;
        return this;
	}

	stop() {
		this.queue.clear();
		this.DisableRepeat();
		this.skip();
		return this;
	  }

	  
	TrackRepeat() {
		this.loop_1 = 1;
		this.loop = "track";
		this.trackRepeat = true;
		this.queueRepeat = false;
		return this;
	  }
	
	  QueueRepeat() {
		this.loop_1 = 2;
		this.loop = "queue"
		this.queueRepeat = true;
		this.trackRepeat = false;
		return this;
	  }
	
	  DisableRepeat() {
		this.loop_1 = 0;
		this.loop = "none"
		this.trackRepeat = false;
		this.queueRepeat = false;
		return this;
	  }

	
	/**
	 * Destroy the player
	 * @returns {void}
	 */
	destroy() {
		this.disconnect();
		this.shoukaku.connection.disconnect();
		this.shoukaku.removeAllListeners();
		this.manager.players.delete(this.guildId);
		this.manager.emit('playerDestroy', this);
	}
}

module.exports = Player;

/**
 * @typedef PlayerOptions
 * @prop {string} guildId
 * @prop {string} voiceId
 * @prop {string} textId
 * @prop {number} volume
 * @prop {shoukaku.Player} ShoukakuPlayer
 */

/**
 * @typedef {'none' | 'track' | 'queue'} LoopType
 */