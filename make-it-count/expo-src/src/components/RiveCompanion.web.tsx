import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRive } from '@rive-app/react-webgl2';
const URL='https://public.rive.app/community/runtime-files/1714-4322-rives-animated-emojis.riv';
export function RiveCompanion(){const {RiveComponent}=useRive({src:URL,stateMachines:'controller',autoplay:true});return <View style={s.wrap}><RiveComponent style={{width:'100%',height:'100%'}}/></View>}
const s=StyleSheet.create({wrap:{width:112,height:112,overflow:'hidden'}});
