import { useRef, useMemo, useEffect } from "react"

import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { useLoader, useFrame } from '@react-three/fiber'
import { RigidBody, useRopeJoint } from "@react-three/rapier"

import * as THREE from 'three'

function TextWeb({ text, color }) {
    const linesRef = useRef();

    /**
     * Generate Web Nodes Array
     */
    const generateWeb = (radius, theta) => {
        const webNodes = []
        webNodes.push({ position: [0, 0, 0], isOuter: false, ring: 0, angle: 0 });

        for (let i = 1; i < radius; i += 1) {
            for (let j = 0; j < Math.PI * 2; j += theta) {
                const nodeX = Math.cos(j) * i + Math.random() * 0.5
                const nodeY = Math.sin(j) * i + Math.random() * 0.5
                const nodeZ = 0

                const isOuter = i === radius - 1;
                webNodes.push({ position: [nodeX, nodeY, nodeZ], isOuter, ring: i, angle: j });
            }
        }

        return webNodes;
    }

    const spokes = 48
    const rings = 10

    const webNodes = useMemo(() => generateWeb(rings, Math.PI / (spokes / 2), text.length), [text]);

    /**
     * Create Joint Link
     */
    const nodes = { current: [] }
    webNodes.map((node, index) => {
        nodes.current[index] = useRef();
    })

    // Create the Center Link
    for (let spoke = 0; spoke < spokes; spoke++) {
        useRopeJoint(
            nodes.current[0],
            nodes.current[1 + spoke],
            [[0, 0, 0], [0, 0, 0], 1],
            { stiffness: 100, damping: 1 }
        )
    }

    // Create the Same Spoke Link
    for (let ring = 0; ring < rings - 1; ring++) {
        for (let spoke = 0; spoke < spokes; spoke++) {
            const currentIdx = 1 + ring * spokes + spoke
            const nextIdx = 1 + (ring + 1) * spokes + spoke

            // Check Index
            if (nextIdx < webNodes.length) {
                const dx = webNodes[currentIdx].position[0] - webNodes[nextIdx].position[0]
                const dy = webNodes[currentIdx].position[1] - webNodes[nextIdx].position[1]
                const distance = Math.sqrt(dx * dx + dy * dy)
                useRopeJoint(
                    nodes.current[currentIdx],
                    nodes.current[nextIdx],
                    [[0, 0, 0], [0, 0, 0], distance],
                    { stiffness: 100, damping: 1 }
                )
            }
        }
    }

    // Ring Link
    for (let ring = 1; ring < rings - 1; ring++) {
        for (let spoke = 0; spoke < spokes; spoke++) {
            const currentIdx = 1 + ring * spokes + spoke
            const nextIdx = 1 + ring * spokes + (spoke + 1) % spokes

            const dx = webNodes[currentIdx].position[0] - webNodes[nextIdx].position[0]
            const dy = webNodes[currentIdx].position[1] - webNodes[nextIdx].position[1]
            const distance = Math.sqrt(dx * dx + dy * dy)
            useRopeJoint(
                nodes.current[currentIdx],
                nodes.current[nextIdx],
                [[0, 0, 0], [0, 0, 0], distance],
                { stiffness: 1000, damping: 1 }
            )
        }
    }

    /**
     * Generate Lines Geometry
     */
    const lineGeometry = useMemo(() => {
        const positions = [];
        const addLine = (idx1, idx2) => {
            const pos1 = webNodes[idx1].position;
            const pos2 = webNodes[idx2].position;
            positions.push(pos1[0], pos1[1], pos1[2]);
            positions.push(pos2[0], pos2[1], pos2[2]);
        };

        // Center to first ring
        for (let spoke = 0; spoke < spokes; spoke++) {
            addLine(0, 1 + spoke);
        }

        // Same spoke links
        for (let ring = 0; ring < rings - 1; ring++) {
            for (let spoke = 0; spoke < spokes; spoke++) {
                const currentIdx = 1 + ring * spokes + spoke;
                const nextIdx = 1 + (ring + 1) * spokes + spoke;
                if (nextIdx < webNodes.length) addLine(currentIdx, nextIdx);
            }
        }

        // Same ring links
        for (let ring = 1; ring < rings - 1; ring++) {
            for (let spoke = 0; spoke < spokes; spoke++) {
                const currentIdx = 1 + ring * spokes + spoke;
                const nextIdx = 1 + ring * spokes + (spoke + 1) % spokes;
                addLine(currentIdx, nextIdx);
            }
        }

        return new THREE.BufferGeometry().setAttribute(
            "position",
            new THREE.Float32BufferAttribute(positions, 3)
        );
    }, [webNodes]);

    /**
     * Update Line Positions Dynamically
     */
    useFrame(() => {
        if (linesRef.current) {
            const positions = linesRef.current.geometry.attributes.position.array;

            let vertexIndex = 0;
            // Center to first ring
            for (let spoke = 0; spoke < spokes; spoke++) {
                const node0 = nodes.current[0].current;
                const node1 = nodes.current[1 + spoke].current;
                if (node0 && node1) {
                    const pos0 = node0.translation();
                    const pos1 = node1.translation();
                    positions[vertexIndex++] = pos0.x;
                    positions[vertexIndex++] = pos0.y;
                    positions[vertexIndex++] = pos0.z;
                    positions[vertexIndex++] = pos1.x;
                    positions[vertexIndex++] = pos1.y;
                    positions[vertexIndex++] = pos1.z;
                }
            }
            // Same spoke links
            for (let ring = 0; ring < rings - 1; ring++) {
                for (let spoke = 0; spoke < spokes; spoke++) {
                    const currentIdx = 1 + ring * spokes + spoke;
                    const nextIdx = 1 + (ring + 1) * spokes + spoke;
                    if (nextIdx < webNodes.length) {
                        const node1 = nodes.current[currentIdx].current;
                        const node2 = nodes.current[nextIdx].current;
                        if (node1 && node2) {
                            const pos1 = node1.translation();
                            const pos2 = node2.translation();
                            positions[vertexIndex++] = pos1.x;
                            positions[vertexIndex++] = pos1.y;
                            positions[vertexIndex++] = pos1.z;
                            positions[vertexIndex++] = pos2.x;
                            positions[vertexIndex++] = pos2.y;
                            positions[vertexIndex++] = pos2.z;
                        }
                    }
                }
            }
            // Same ring links
            for (let ring = 1; ring < rings - 1; ring++) {
                for (let spoke = 0; spoke < spokes; spoke++) {
                    const currentIdx = 1 + ring * spokes + spoke;
                    const nextIdx = 1 + ring * spokes + (spoke + 1) % spokes;
                    const node1 = nodes.current[currentIdx].current;
                    const node2 = nodes.current[nextIdx].current;
                    if (node1 && node2) {
                        const pos1 = node1.translation();
                        const pos2 = node2.translation();
                        positions[vertexIndex++] = pos1.x;
                        positions[vertexIndex++] = pos1.y;
                        positions[vertexIndex++] = pos1.z;
                        positions[vertexIndex++] = pos2.x;
                        positions[vertexIndex++] = pos2.y;
                        positions[vertexIndex++] = pos2.z;
                    }
                }
            }

            linesRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    const font = useLoader(FontLoader, "/fonts/FangSong_Regular.json");
    const string = text ? [...text] : [" "];
    const stringGeometry = useMemo(() => {
        return string.map((char) => {
            const textGeometry = new TextGeometry(char, {
                font: font,
                size: 1,
                height: 1,
                bevelEnabled: false,
            });
            textGeometry.center();
            return textGeometry;
        });

    }, [text]);

    const clickHandler = (index, event) => {
        const rigidBody = nodes.current[index];
        if (rigidBody.current !== null) {
            rigidBody.current.applyImpulse({ x: 0, y: -0.5, z: 0 }, true);
        }
    }

    // 添加一个材质引用
    const lineMaterialRef = useRef();
    const meshMaterialRef = useRef();

    // 使用 useEffect 监听颜色变化
    useEffect(() => {
        if (lineMaterialRef.current) {
            lineMaterialRef.current.color.set(color);
        }
        if (meshMaterialRef.current) {
            meshMaterialRef.current.color.set(color);
        }
    }, [color]);

    return (<>
        {webNodes.map((node, index) =>
        (
            <RigidBody
                key={index}
                position={node.position}
                ref={nodes.current[index]}
                type={node.isOuter ? "fixed" : "dynamic"}
                onPointerOver={(event) => clickHandler(index, event)}
                lockRotations={true}
                mass={0.01}
            >
                {/* <mesh geometry={stringGeometry[Math.floor(Math.random() * string.length)]} scale={[0.5, 0.5, 0.0005]}> */}
                <mesh
                    geometry={stringGeometry[index % string.length]}
                    scale={[
                        Math.max(0.4, (index / webNodes.length)),
                        Math.max(0.4, (index / webNodes.length)),
                        0.00025,
                    ]}
                >
                    <meshBasicMaterial ref={meshMaterialRef} color={color} />
                </mesh>
            </RigidBody>
        )
        )}

        <lineSegments ref={linesRef} geometry={lineGeometry}>
            <lineBasicMaterial ref={lineMaterialRef} color='#b3b3b3' transparent={true} opacity={0.5} />
        </lineSegments>
    </>)
}

export default TextWeb