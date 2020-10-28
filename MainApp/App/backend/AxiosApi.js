import {Alert} from 'react-native';
import axios from 'axios';
import qs from 'qs';

export async function getToken(callId, name) {
  console.log('callId: ', callId);
  console.log('name: ', name);

  let parsed_response = null;
  try {
    await axios({
      method: 'post',
      url: 'https://servicebe.connectavo.com/api/virtual-eye/token?',
      data: qs.stringify({
        callId: callId,
        name: name,
      }),
      config: {
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      },
    })
      .then(function(response) {
        console.log('response: ', response);
        parsed_response = response;
      })
      .catch(function(err) {
        //handle error
        throw err;
      });
  } catch (error) {
    Alert.alert('Please enter a valid call ID.');
    throw error;
  }
  return parsed_response;
}
