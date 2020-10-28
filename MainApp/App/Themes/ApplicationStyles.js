import Metrics from './Metrics';

// This file is for a reusable grouping of Theme items.
// Similar to an XML fragment layout in Android

const ApplicationStyles = {
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  splashLogo: {
    height: Metrics.screenHeight * 0.5,
    width: Metrics.screenWidth * 0.5,
    resizeMode: 'contain',
  },
  icons: {
    height: Metrics.screenHeight * 0.04,
    width: Metrics.screenWidth * 0.05,
    resizeMode: 'contain',
  },
  headerLeft: {
    width: Metrics.screenWidth * 0.1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  headerRight: {
    width: Metrics.screenWidth * 0.1,
  },
  circlesContainer: {
    position: 'absolute',
    flex: 0.1,
    left: 0,
    right: 0,
    bottom: 20,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registrationbutton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: Metrics.screenWidth * 0.5 - 38,
    bottom: 120,
    width: 75,
    height: 75,
    backgroundColor: '#1daecd',
    borderRadius: 38,
    borderColor: 'white',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 1,
    shadowOpacity: 0.5,
    overflow: 'visible',
  },
};

export default ApplicationStyles;
