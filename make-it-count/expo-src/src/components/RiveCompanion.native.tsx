import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RiveView,useRiveFile,Fit } from '@rive-app/react-native';
const URL='https://public.rive.app/community/runtime-files/1714-4322-rives-animated-emojis.riv';
export function RiveCompanion(){const {riveFile}=useRiveFile(URL);return <View style={s.wrap}>{riveFile?<RiveView file={riveFile} stateMachineName="controller" autoPlay fit={Fit.Contain} style={s.rive}/>:null}</View>}
const s=StyleSheet.create({wrap:{width:112,height:112,overflow:'hidden'},rive:{width:112,height:112}});
