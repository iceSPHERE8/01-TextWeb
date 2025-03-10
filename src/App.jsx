import { Suspense, useState } from 'react'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from "@react-three/rapier"

import TextWeb from './components/text-web'
import TextInput from './components/text-input'

import './App.css'

function App() {
  const [inputValue, setInputValue] = useState('')
  const [inputColor, setInputColor] = useState('#ffffff')
  const [bgColor, setBgColor] = useState('#000000')

  const handleInputValue = (text) => {
    setInputValue(text)
  }

  const handleColorValue = (color) => {
    setInputColor(color)
  }

  const handleBgColorValue = (color) => {
    setBgColor(color)
  }

  return (
    <>
    <Suspense fallback>
      <Canvas style={{backgroundColor:bgColor}} camera={{ position: [0, 0, 10] }}>
        <OrbitControls />
        <Physics timeStep={0.01} gravity={[0, -4, 0]}>
          <TextWeb text={inputValue == '' ? '你好' : inputValue} color={inputColor} />
        </Physics>
      </Canvas>
      </Suspense>
      <TextInput onInput={handleInputValue} onColor={handleColorValue} onBgColor={handleBgColorValue} />
    </>
  )
}

export default App
