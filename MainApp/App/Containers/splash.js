import {ActivityIndicator, Image, Linking, Platform, View} from 'react-native';
import React, {Component} from 'react';

import colors from '../Themes/Colors';
import images from '../Themes/Images';
import {totalSize} from 'react-native-dimension';

export default class Splash extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    setTimeout(() => {
      this.props.navigation.navigate('App');
      //   this.props.navigation.navigate(userToken ? 'App' : 'Auth');
    }, 2000);
    // if (Platform.OS === 'ios') {
    //   Linking.openURL('app-settings:');
    // }
  };

  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.Green,
        }}>
        <Image
          style={{
            height: totalSize(10),
            width: totalSize(30),
            alignItems: 'center',
            justifyContent: 'center',
            resizeMode: 'contain',
          }}
          source={images.logo}
        />
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <ActivityIndicator color={colors.Darkgraycolor} size={'small'} />
        </View>
      </View>
    );
  }
}
