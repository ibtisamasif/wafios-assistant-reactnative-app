import {
  Alert,
  BackHandler,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {Component} from 'react';
import {
  TwilioVideo,
  TwilioVideoLocalView,
  TwilioVideoParticipantView,
} from 'react-native-twilio-video-webrtc';

// import {Icon} from 'react-native-elements';
import {PERMISSIONS} from 'react-native-permissions';
import {checkMultiplePermissions} from '../Utils/index';
import colors from '../../Themes/Colors';
import {getToken} from '../../backend/AxiosApi';
import {totalSize} from 'react-native-dimension';

class Home extends Component {
  state = {
    enableCamera: true,
    isAudioEnabled: true,
    isVideoEnabled: true,
    status: 'disconnected',
    participants: new Map(),
    videoTracks: new Map(),
    roomName: '',
    token: '',
    callId: '',
    name: 'John Smith',
  };

  async checkForPermissions() {
    const permissions =
      Platform.OS === 'ios'
        ? [PERMISSIONS.IOS.MICROPHONE, PERMISSIONS.IOS.CAMERA]
        : [PERMISSIONS.ANDROID.RECORD_AUDIO, PERMISSIONS.ANDROID.CAMERA];

    // Call our permission service and check for permissions
    const isPermissionGranted = await checkMultiplePermissions(permissions);
    if (!isPermissionGranted) {
      // Show an alert in case permission was not granted
      Alert.alert(
        'Permission Request',
        'Please allow permission to access the Microphone.',
        [
          {
            text: 'Go to Settings',
            onPress: () => {
              Linking.openSettings();
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        {cancelable: false},
      );
    }
    return isPermissionGranted;
  }

  async requestPermissions() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Virtual Eye Camera Permission',
          message:
            'Virtual Eye needs access to your camera ' +
            'so you can do video conferencing',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Virtual Eye Audio Permission',
          message:
            'Virtual Eye needs access to your microphone ' +
            'so you can do video conferencing',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the camera');
      } else {
        console.log('Camera permission denied');
        BackHandler.exitApp();
      }
    } catch (err) {
      console.warn(err);
    }
  }

  getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  static navigationOptions = {
    title: 'Home',
  };
  componentDidMount() {
    this.checkForPermissions();
    // this.requestPermissions();

    if (Platform.OS === 'android') {
      Linking.getInitialURL().then(url => {
        this.navigate(url);
      });
    } else {
      Linking.addEventListener('url', this.handleOpenURL);
    }
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.handleOpenURL);
  }
  handleOpenURL = event => {
    this.navigate(event.url);
  };
  navigate = url => {
    if (url != null) {
      console.log(url);
      const route = url.replace(/.*?:\/\//g, '');
      // const id = route.match(/\/([^\/]+)\/?$/)[1];
      const routeName = route.split('?')[0];
      console.log('rootName', routeName);
      if (routeName === 'assistant.connectavo.com' || routeName === 'assistant.connectavo.com/') {
        var calid = this.getParameterByName('callId', url);
        console.log('id', calid);
        this.setState({callId: calid});
      }
    }
  };

  async onGetTokenFunc() {
    const {callId, name} = this.state;
    if (callId === '') {
      Alert.alert('Call ID can not be empty');
    } else {
      this.setState({loading: true});
      let callback = await getToken(callId, name);
      this.setState({loading: false});

      console.log('callback', callback);

      if (callback) {
        try {
          this.twilioRef.connect({
            roomName: callback.data.title,
            accessToken: callback.data.token,
          });
        } catch (error) {
          console.log(error);
        }

        this.setState({status: 'connecting'});
      }
    }
  }

  _onEndButtonPress = () => {
    this.twilioRef.disconnect();
  };

  _onMuteButtonPress = () => {
    this.twilioRef
      .setLocalAudioEnabled(!this.state.isAudioEnabled)
      .then(isEnabled => this.setState({isAudioEnabled: isEnabled}));
  };

  _onCameraButtonPress = () => {
    this.state.enableCamera
      ? this.setState({enableCamera: false})
      : this.setState({enableCamera: true});
    Alert.alert('Coming soon...');
  };

  _onFlipButtonPress = () => {
    this.twilioRef.flipCamera();
  };

  _onRoomDidConnect = () => {
    this.setState({status: 'connected'});
  };

  _onRoomDidDisconnect = ({roomName, error}) => {
    console.log('ERROR: ', error);

    this.setState({status: 'disconnected'});
  };

  _onRoomDidFailToConnect = error => {
    console.log('ERROR: ', error);

    this.setState({status: 'disconnected'});
  };

  _onParticipantAddedVideoTrack = ({participant, track}) => {
    console.log('onParticipantAddedVideoTrack: ', participant, track);

    this.setState({
      videoTracks: new Map([
        ...this.state.videoTracks,
        [
          track.trackSid,
          {participantSid: participant.sid, videoTrackSid: track.trackSid},
        ],
      ]),
    });
  };

  _onParticipantRemovedVideoTrack = ({participant, track}) => {
    console.log('onParticipantRemovedVideoTrack: ', participant, track);

    const videoTracks = this.state.videoTracks;
    videoTracks.delete(track.trackSid);

    this.setState({videoTracks: new Map([...videoTracks])});
  };

  setTwilioRef = ref => {
    this.twilioRef = ref;
  };

  render() {
    return (
      <View style={styles.container}>
        {this.state.status === 'disconnected' && (
          <View>
            <Text style={styles.welcome}>Join a call by ID</Text>
            <TextInput
              placeholder="e.g 234 432 234"
              placeholderTextColor="gray"
              style={styles.input}
              autoCapitalize="none"
              value={this.state.callId}
              onChangeText={text => this.setState({callId: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g John Smith"
              placeholderTextColor="gray"
              autoCapitalize="none"
              value={this.state.name}
              onChangeText={text => this.setState({name: text})}
            />
            <TouchableOpacity
              title="JOIN CALL"
              style={styles.joinCallButton}
              onPress={() => this.onGetTokenFunc()}>
              <Text style={styles.joinCallText}>JOIN CALL </Text>
            </TouchableOpacity>
          </View>
        )}

        {this.state.status === 'connected' ||
        this.state.status === 'connecting' ? (
          <View style={styles.callContainer}>
            {this.state.status === 'connected' && (
              <View style={styles.remoteGrid}>
                {Array.from(
                  this.state.videoTracks,
                  ([trackSid, trackIdentifier]) => {
                    return (
                      <TwilioVideoParticipantView
                        style={styles.remoteVideo}
                        key={trackSid}
                        trackIdentifier={trackIdentifier}
                      />
                    );
                  },
                )}
              </View>
            )}
            <View>
              <TwilioVideoLocalView
                enabled={this.state.enableCamera}
                style={styles.localVideo}
              />
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={this._onFlipButtonPress}>
                  <Text style={{fontSize: 12}}>Flip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={this._onMuteButtonPress}>
                  <Text style={{fontSize: 12}}>
                    {this.state.isAudioEnabled ? 'Mute' : 'Unmute'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={this._onCameraButtonPress}>
                  <Text style={{fontSize: 12}}>Annotate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.endButton}
                  onPress={this._onEndButtonPress}>
                  {/* <Icon
                    name="staro"
                    type="antdesign"
                    size={totalSize(3)}
                    color="white"
                  /> */}
                  <Text style={{fontSize: 12}}>End</Text>
                </TouchableOpacity>
                <View />
              </View>
            </View>
          </View>
        ) : null}

        <TwilioVideo
          ref={this.setTwilioRef}
          onRoomDidConnect={this._onRoomDidConnect}
          onRoomDidDisconnect={this._onRoomDidDisconnect}
          onRoomDidFailToConnect={this._onRoomDidFailToConnect}
          onParticipantAddedVideoTrack={this._onParticipantAddedVideoTrack}
          onParticipantRemovedVideoTrack={this._onParticipantRemovedVideoTrack}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  callContainer: {
    flex: 1,
  },
  welcome: {
    fontSize: 30,
    textAlign: 'center',
    paddingTop: 40,
  },
  input: {
    height: 50,
    marginRight: 70,
    marginLeft: 70,
    marginTop: 50,
    textAlign: 'center',
    backgroundColor: 'white',
    borderBottomColor: colors.Green,
    borderBottomWidth: 2,
  },
  joinCallButton: {
    width: 190,
    height: 60,
    marginLeft: 110,
    marginTop: 100,
    backgroundColor: colors.Green,
    paddingTop: 20,
    paddingBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinCallText: {
    color: '#fff',
    textAlign: 'center',
  },
  localVideo: {
    flex: 0,
    flexDirection: 'row-reverse',
    width: 160,
    height: 125,
    position: 'absolute',
    right: 10,
    bottom: 600,
    borderRadius: 2,
    borderColor: '#4e4e4e',
  },
  remoteGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  optionsContainer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButton: {
    width: 60,
    height: 60,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 100 / 2,
    backgroundColor: colors.transparentGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endButton: {
    width: 60,
    height: 60,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 100 / 2,
    backgroundColor: colors.transparentRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonFlip: {
    width: 60,
    height: 60,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 100 / 2,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Home;
