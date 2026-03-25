import { Platform } from 'react-native';

export const PAYTM_BLUE = '#002E6E';
export const PAYTM_LIGHT_BLUE = '#00BAF2';
export const SUCCESS_GREEN = '#21C17C';
export const ERROR_RED = '#FF4E4E';
export const BACKGROUND_COLOR = '#F5F7FA';
export const WHITE = '#FFF';

export const fonts = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const layout = {
  headerHeight: Platform.OS === 'ios' ? 100 : 88,
  headerPaddingTop: Platform.OS === 'ios' ? 44 : 32,
  screenPadding: 16,
};
