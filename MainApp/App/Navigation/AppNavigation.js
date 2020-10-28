import {createAppContainer, createSwitchNavigator} from 'react-navigation';

import Home from '../Containers/MainFlow/Home';
import Splash from '../Containers/splash';
import {createStackNavigator} from 'react-navigation-stack';

// const AuthStack = createStackNavigator({
//   login: {
//     screen: Login
//   }
// });

const AppStack = createStackNavigator({
  Home: {
    screen: Home,
    navigationOptions: {
      header: null,
    },
  },
});

export default createAppContainer(
  createSwitchNavigator(
    {
      splash: Splash,
      // Auth: AuthStack,
      App: AppStack,
    },
    {
      initialRouteName: 'splash',
    },
  ),
);
