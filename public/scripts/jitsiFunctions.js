var jitsiFunctions = {
	onConnectionSuccess: function(e) {
		var self = this;
		const confOptions = {
			openBridgeChannel: true,
		}
		self.room = self.connection.initJitsiConference('conference', confOptions)
	},
	unload: function() {
		var self = this;
		for (let i = 0; i < self.localTracks.length; i++) {
			self.localTracks[i].dispose();
		}
		self.room.leave();
		self.connection.disconnect();
	},
	switchVideo: function() { // eslint-disable-line no-unused-vars
		var self = this;
		var isVideo = self.isVideo;
		self.isVideo = !isVideo;
		if (self.localTracks[1]) {
				self.localTracks[1].dispose();
				self.localTracks.pop();
		}
		JitsiMeetJS.createLocalTracks({
				devices: [ self.isVideo ? 'video' : 'desktop' ]
		})
				.then(tracks => {
						self.localTracks.push(tracks[0]);
						self.localTracks[1].addEventListener(
								JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
								() => console.log('local track muted'));
						self.localTracks[1].addEventListener(
								JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
								() => console.log('local track stoped'));
						self.localTracks[1].attach($('#localVideo1')[0]);
						self.room.addTrack(self.localTracks[1]);
				})
				.catch(error => console.log(error));
	},
	changeAudioOutput: function(selected) { // eslint-disable-line no-unused-vars
		JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
	},
	onLocalTracks: function(tracks) {
		var self = this;
		self.localTracks = tracks;
		for (let i = 0; i < self.localTracks.length; i++) {
				self.localTracks[i].addEventListener(
						JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
						audioLevel => console.log(`Audio Level local: ${audioLevel}`));
				self.localTracks[i].addEventListener(
						JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
						() => console.log('local track muted'));
				self.localTracks[i].addEventListener(
						JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
						() => console.log('local track stoped'));
				self.localTracks[i].addEventListener(
						JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
						deviceId =>
								console.log(
										`track audio output device was changed to ${deviceId}`));
				if (self.localTracks[i].getType() === 'video') {
						$('body').append(`<video autoplay='1' id='localVideo${i}' />`);
						self.localTracks[i].attach($(`#localVideo${i}`)[0]);
				} else {
						$('body').append(
								`<audio autoplay='1' muted='true' id='localAudio${i}' />`);
						self.localTracks[i].attach($(`#localAudio${i}`)[0]);
				}
				if (self.isJoined) {
						self.room.addTrack(self.localTracks[i]);
				}
		}
	},
	onConnectionFailed: function() {
		console.error('Connection Failed!');
	},
	onDeviceListChanged: function(devices) {
		console.info('current devices', devices);
	},
	disconnect: function() {
		var self = this;
		console.log('disconnect!');
		self.connection.removeEventListener(
				JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
				self.onConnectionSuccess);
		self.connection.removeEventListener(
				JitsiMeetJS.events.connection.CONNECTION_FAILED,
				self.onConnectionFailed);
		self.connection.removeEventListener(
				JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED,
				self.disconnect);
	},
	onUserLeft: function(id) {
		var self = this;
		console.log('user left');
		if (!self.remoteTracks[id]) {
				return;
		}
		const tracks = self.remoteTracks[id];

		for (let i = 0; i < tracks.length; i++) {
				tracks[i].detach($(`#${id}${tracks[i].getType()}`));
		}
	},
	onRemoteTrack: function (track) {
		var self = this;
		if (track.isLocal()) {
				return;
		}
		const participant = track.getParticipantId();

		if (!self.remoteTracks[participant]) {
				self.remoteTracks[participant] = [];
		}
		const idx = self.remoteTracks[participant].push(track);

		track.addEventListener(
				JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED,
				audioLevel => console.log(`Audio Level remote: ${audioLevel}`));
		track.addEventListener(
				JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
				() => console.log('remote track muted'));
		track.addEventListener(
				JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
				() => console.log('remote track stoped'));
		track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED,
				deviceId =>
						console.log(
								`track audio output device was changed to ${deviceId}`));
		const id = participant + track.getType() + idx;

		if (track.getType() === 'video') {
				$('body').append(
						`<video autoplay='1' id='${participant}video${idx}' />`);
		} else {
				$('body').append(
						`<audio autoplay='1' id='${participant}audio${idx}' />`);
		}
		track.attach($(`#${id}`)[0]);
}

}