import { useRef, useState } from "react"

function TextInput({ onInput, onColor, onBgColor }) {
    const [inputColor, setInputColor] = useState('#ffffff')
    const [bgColor, setBgColor] = useState('#000000')

    const textRef = useRef()
    const colorRef = useRef()
    const bgColorRef = useRef()

    const generateHandler = () => {
        if (textRef) {
            onInput(textRef.current.value)
        }
    }

    const changeColorHandler = () => {
        if (colorRef) {
            onColor(colorRef.current.value)
            setInputColor(colorRef.current.value)
        }
    }

    const changeBgColorHandler = () => {
        if (colorRef) {
            onBgColor(bgColorRef.current.value)
            setBgColor(bgColorRef.current.value)
        }
    }

    return <div className="text-2xl mb-4 text-white fixed z-auto bottom-0 w-full flex justify-center">
        <div className="flex items-center">
            <input type="color" ref={bgColorRef} value={bgColor} onChange={changeBgColorHandler} className="rounded-sm w-9 h-9 hover:cursor-pointer outline-none" />
            <input type="color" ref={colorRef} value={inputColor} onChange={changeColorHandler} className="rounded-sm w-9 h-9 hover:cursor-pointer outline-none" />
        </div>
        <div className="bg-white p-0.5 flex justify-center items-center rounded-sm ml-4">
            <input type="text" placeholder="输入你的文字" ref={textRef} className="bg-white outline-none text-black py-1 px-2 rounded-sm text-sm border-gray-300 border-3" />
        </div>
        <div className="bg-white p-0.5 flex justify-center items-center rounded-sm ml-4">
            <button onClick={generateHandler} className="border-gray-300 border-3 text-sm font-bold text-black rounded-sm py-1 px-2 bg-white hover:cursor-pointer hover:bg-gray-300 hover:text-white">GENERATE</button>
        </div>

    </div >
}

export default TextInput