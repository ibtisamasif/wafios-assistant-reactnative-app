import {
  Alert,
  BackHandler,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// import Icon from 'react-native-vector-icons/FontAwesome';
import React, {Component} from 'react';
import {
  TwilioVideo,
  TwilioVideoLocalView,
  TwilioVideoParticipantView,
} from 'react-native-twilio-video-webrtc';
import {height, totalSize, width} from 'react-native-dimension';

import {Icon} from 'react-native-elements';
import Modal from 'react-native-modal';
import {PERMISSIONS} from 'react-native-permissions';
import {checkMultiplePermissions} from '../Utils/index';
import colors from '../../Themes/Colors';
import {getToken} from '../../backend/AxiosApi';
import images from '../../Themes/Images';
import type from '../../Themes/Fonts';

export default class Home extends Component {
  state = {
    isAudioEnabled: true,
    isVideoEnabled: true,
    status: 'disconnected',
    participants: new Map(),
    videoTracks: new Map(),
    roomName: '',
    token: '',
    callId: '',
    name: 'John' + Math.floor(Math.random() * 100) + 1,
    isModalVisible: false,
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
        'Please allow permission to access the Microphone and Camera.',
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
      if (
        routeName === 'assistant.connectavo.com' ||
        routeName === 'assistant.connectavo.com/'
      ) {
        var calid = this.getParameterByName('callId', url);
        console.log('id', calid);
        this.setState({callId: calid});
      }
    }
  };

  async onGetTokenFunc() {
    const {callId, name} = this.state;
    if (callId === '') {
      this.toggleModal();
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

  _onDrawButtonPress = () => {
    Alert.alert('Coming soon..');
  };

  _onMuteButtonPress = () => {
    this.twilioRef
      .setLocalAudioEnabled(!this.state.isAudioEnabled)
      .then(isEnabled => this.setState({isAudioEnabled: isEnabled}));
  };

  _onCameraButtonPress = () => {
    this.twilioRef
      .setLocalVideoEnabled(!this.state.isVideoEnabled)
      .then(isEnabled => this.setState({isVideoEnabled: isEnabled}));
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

  toggleModal = () => {
    this.setState({isModalVisible: !this.state.isModalVisible});
  };

  render() {
    return (
      <View style={styles.container}>
        <Modal
          isVisible={this.state.isModalVisible}
          onBackdropPress={this.toggleModal}>
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <View
              style={{
                width: Platform.OS == 'ios' ? totalSize(32) : totalSize(36),
                backgroundColor: colors.snow,
                borderRadius: totalSize(0.5),
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: Platform.OS == 'ios' ? totalSize(7.5) : totalSize(8.5),
                  height:
                    Platform.OS == 'ios' ? totalSize(7.5) : totalSize(8.5),
                  borderRadius:
                    Platform.OS == 'ios'
                      ? totalSize(7.5) / 2
                      : totalSize(8.5) / 2,
                  backgroundColor: colors.snow,
                  position: 'absolute',
                  top: -totalSize(4),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    width: Platform.OS == 'ios' ? totalSize(7) : totalSize(8),
                    height: Platform.OS == 'ios' ? totalSize(7) : totalSize(8),
                    borderRadius:
                      Platform.OS == 'ios'
                        ? totalSize(7) / 2
                        : totalSize(8) / 2,
                    backgroundColor: colors.redColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Icon
                    name="close"
                    type="font-awesome"
                    size={totalSize(5)}
                    color={colors.snow}
                  />
                </View>
              </View>
              <Text
                style={{
                  fontSize: totalSize(2.8),
                  marginHorizontal: totalSize(4.5),
                  marginTop: totalSize(4.5),
                  textAlign: 'center',
                  color: colors.coal,
                }}>
                Call ID can't be empty
              </Text>
              <Text
                style={{
                  fontSize: totalSize(1.9),
                  marginHorizontal: totalSize(3),
                  marginTop: totalSize(1.5),
                  color: colors.charcoal,
                }}>
                Please enter a valid call ID
              </Text>

              <TouchableOpacity
                onPress={this.toggleModal}
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: Platform.OS == 'ios' ? totalSize(28) : totalSize(32),
                  marginVertical: totalSize(1.4),
                  paddingVertical: totalSize(0.8),
                  borderRadius: totalSize(0.5),
                  backgroundColor: colors.redColor,
                }}>
                <Text
                  style={{
                    fontSize: totalSize(2.2),
                    color: colors.snow,
                  }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {this.state.status === 'disconnected' && (
          <>
            <View style={styles.upper}>
              <TwilioVideoLocalView
                enabled={true}
                style={{width: '100%', height: '100%'}}
              />
              <Image
                style={{
                  height: Platform.OS == 'ios' ? height(6.5) : height(7.5),
                  width: Platform.OS == 'ios' ? width(68) : width(70),
                  resizeMode: 'contain',
                  position: 'absolute',
                  top: totalSize(4),
                }}
                source={images.logo}
              />
              <TouchableOpacity
                onPress={this._onFlipButtonPress}
                style={[
                  styles.iconParent,
                  {
                    position: 'absolute',
                    right: totalSize(1),
                    top: totalSize(11),
                  },
                ]}>
                <Image
                  style={styles.iconImage}
                  tintColor={colors.snow}
                  source={images.cameraFlip}
                />
              </TouchableOpacity>

              <View
                style={{
                  position: 'absolute',
                  bottom: totalSize(2),
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                }}>
                <TouchableOpacity
                  onPress={this._onCameraButtonPress}
                  style={styles.bottomIconParent}>
                  <Image
                    style={[styles.iconImage]}
                    tintColor={colors.snow}
                    source={
                      this.state.isVideoEnabled ? images.video : images.videMute
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={this._onMuteButtonPress}
                  style={styles.bottomIconParent}>
                  <Image
                    style={[styles.iconImage]}
                    tintColor={colors.snow}
                    source={
                      this.state.isAudioEnabled ? images.mic : images.micMute
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.bottom}>
              <Text style={styles.welcome}>Join a call by ID</Text>
              <View
                style={{
                  width: width(100),
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingHorizontal: totalSize(3),
                }}>
                <TextInput
                  placeholder="e.g 234 432 234"
                  placeholderTextColor={colors.steel}
                  style={styles.input}
                  autoCapitalize="none"
                  value={this.state.callId}
                  onChangeText={text => this.setState({callId: text})}
                />
                <TouchableOpacity
                  style={styles.joinCallButton}
                  onPress={() => this.onGetTokenFunc()}>
                  <Text style={styles.joinCallText}>JOIN CALL </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {this.state.status === 'connected' ||
        this.state.status === 'connecting' ? (
          <View style={styles.callContainer}>
            {this.state.status === 'connected' && (
              <View>
                <View>
                  {Array.from(
                    this.state.videoTracks,
                    ([trackSid, trackIdentifier]) => {
                      return (
                        <TwilioVideoParticipantView
                          style={[
                            styles.remoteVideo,
                            {
                              transform: [{scaleX: -1}],
                            },
                          ]}
                          key={trackSid}
                          trackIdentifier={trackIdentifier}
                        />
                      );
                    },
                  )}
                </View>
                <TwilioVideoLocalView
                  enabled={this.state.isVideoEnabled}
                  style={[
                    styles.localVideo,
                    {
                      transform: [{scaleX: -1}],
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={this._onFlipButtonPress}
                  style={[styles.iconParent, styles.flipCamera]}>
                  <Image
                    style={styles.iconImage}
                    tintColor={colors.snow}
                    source={images.cameraFlip}
                  />
                </TouchableOpacity>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    onPress={this._onCameraButtonPress}
                    style={styles.bottomIconParent}>
                    <Image
                      style={[styles.iconImage]}
                      tintColor={colors.snow}
                      source={
                        this.state.isVideoEnabled
                          ? images.video
                          : images.videMute
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={this._onMuteButtonPress}
                    style={styles.bottomIconParent}>
                    <Image
                      style={styles.iconImage}
                      tintColor={colors.snow}
                      source={
                        this.state.isAudioEnabled ? images.mic : images.micMute
                      }
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={this._onDrawButtonPress}
                    style={styles.bottomIconParent}>
                    <Image
                      style={styles.iconImage}
                      tintColor={colors.snow}
                      source={images.draw}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={this._onEndButtonPress}
                    style={[
                      styles.bottomIconParent,
                      {backgroundColor: colors.redColor},
                    ]}>
                    <Icon
                      name="call-end"
                      type="SimpleLineIcons"
                      size={totalSize(3.5)}
                      color={colors.snow}
                    />
                  </TouchableOpacity>
                  <View />
                </View>
              </View>
            )}
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
    fontSize: totalSize(3.2),
    margin: totalSize(2.5),
    color: 'grey',
    // textAlign: 'center',
    // paddingTop: 40,
  },
  input: {
    //  marginLeft: totalSize(2),
    textAlign: 'center',
    backgroundColor: 'white',
    borderBottomColor: colors.Green,
    borderBottomWidth: 2,
    fontSize: totalSize(2.5),
  },
  joinCallButton: {
    // alignSelf: 'flex-end',
    width: width(37),
    paddingVertical: totalSize(1.4),
    backgroundColor: colors.Green,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  joinCallText: {
    color: '#fff',
  },
  localVideo: {
    width: totalSize(18),
    height: totalSize(12),
    position: 'absolute',
    left: totalSize(1.5),
    top: totalSize(5),
    borderRadius: 2,
    borderColor: '#4e4e4e',
  },
  flipCamera: {
    position: 'absolute',
    top: totalSize(5),
    right: totalSize(1),
  },
  remoteGrid: {
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
  bottom: {
    flex: Platform.OS == 'ios' ? 2.4 : 2.6,
    alignItems: 'flex-start',
  },
  upper: {
    flex: 7.2,
    alignItems: 'center',
  },
  circle: {
    width: totalSize(3),
    height: totalSize(3),
    backgroundColor: 'white',
    borderRadius: totalSize(3 / 2),
    marginTop: totalSize(1),
    marginLeft: totalSize(0.1),
  },
  iconParent: {
    height: totalSize(6),
    width: totalSize(6),
    borderRadius: totalSize(6 / 2),
    backgroundColor: colors.charcoalLow,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: totalSize(2.5),
    // marginTop: totalSize(1),
  },
  bottomIconParent: {
    height: totalSize(6),
    width: totalSize(6),
    borderRadius: totalSize(6 / 2),
    backgroundColor: colors.coalLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: totalSize(1.5),
  },
  iconImage: {
    width: totalSize(3),
    height: totalSize(3),
    resizeMode: 'contain',
    tintColor: colors.snow,
  },
});
