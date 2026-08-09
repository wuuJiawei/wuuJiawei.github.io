import React from 'react';
import { View } from 'react-native';

/**
 * Reserved Rive slot.
 *
 * The previous prototype loaded a random community animation from a remote URL,
 * which broke the product's art direction and made the build depend on a third party.
 * Keep the runtime dependency available, but only wire this component again when a
 * reviewed `.riv` asset is checked into `assets/rive/` with its license documented.
 */
export function RiveCompanion() {
  return <View />;
}
