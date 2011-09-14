/*!
 * New BSD License
 *
 * Copyright (c) 2011, Morten Nobel-Joergensen, Kickstart Games ( http://www.kickstartgames.com/ )
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
 * following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, this list of conditions and the following
 * disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
 * disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var KICK = KICK || {};

KICK.namespace = KICK.namespace || function (ns_string) {
    var parts = ns_string.split("."),
        parent = KICK,
        i;
    // strip redundant leading global
    if (parts[0] === "KICK") {
        parts = parts.slice(1);
    }

    for (i = 0; i < parts.length; i += 1) {
        // create property if it doesn't exist
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
};

(function () {
    "use strict"; // force strict ECMAScript 5

    var scene = KICK.namespace("KICK.scene"),
        core = KICK.namespace("KICK.core"),
        math = KICK.namespace("KICK.math"),
        vec3 = KICK.namespace("KICK.math.vec3"),
        vec4 = KICK.namespace("KICK.math.vec4"),
        mat4 = KICK.namespace("KICK.math.mat4"),
        degreeToRadian = math.Mathf.DEGREE_TO_RADIAN;
    
    /**
     * Live objects in the scene
     * @class GameObject
     * @namespace KICK.scene
     * @constructor
     * @param scene {KICK.scene.Scene}
     */
    scene.GameObject = function (scene) {
        /**
         * Reference to the containing scene
         * @property scene
         * @type KICK.scene.Scene
         * @public
         */
        Object.defineProperty(this, "scene", {
            value:scene
        });

        /**
         * Reference to the engine
         * @property engine
         * @type KICK.core.Engine
         * @public
         */
        Object.defineProperty(this, "engine", {
            value:scene.engine
        });

        /**
         * Reference to the transform
         * @property transform
         * @type KICK.scene.Transform
         * @public
         */
        this.transform = new KICK.scene.Transform(this);
        this._components = [];
    };

    /**
     * Add the component to a gameObject and set the gameObject field on the component
     * @method addComponent
     * @param {KICK.scene.Component} component
     */
    scene.GameObject.prototype.addComponent = function (component) {
        if (component.gameObject) {
            throw {
                name: "Error",
                message: "Component "+component+" already added to gameObject "+component.gameObject
            };
        }
        if (!component.scriptPriority) {
            component.scriptPriority = 0;
        }
        if (component instanceof scene.Camera) {
            this.scene.addCamera(component);
        }
        component.gameObject = this;
        this._components.push(component);
        this.scene.addComponent(component);
    };

    /**
     * Remove the component from a gameObject and clear the gameObject field on the component
     * @method removeComponent
     * @param {KICK.scene.Component} component
     */
    scene.GameObject.prototype.removeComponent = function (component) {
        delete component.gameObject;
        core.Util.removeElementFromArray(this._components,component);
        this.scene.removeComponent(component);
    };

    /**
     * Destroys game object after next frame.
     * Removes all components instantly.
     * @method destroy
     */
    scene.GameObject.prototype.destroy = function () {
        var components = this._components,
            i;
        for (i=0; i < components.length; i++) {
            this.removeComponent(components[i]);
        }
        this.scene.destroyObject(this);
    };

    /**
     * This class only specifies the interface of a component.
     * @namespace KICK.scene
     * @class Component
     */
//scene.Component = function () {
    /**
     * The gameObject owning the component. Initially undefined. The value is set when the Component object is added
     * to a GameObject
     * @property gameObject
     * @type KICK.scene.GameObject
     */

    /**
     * Abstract method called when a component is added to scene. May be undefined.
     * @method activated
     */

    /**
     * Abstract method called when a component is removed from scene. May be undefined.
     * @method deactivated
     */


    /**
     * Abstract method called every rendering. May be undefined.
     * @method render
     * @param (KICK.math.mat4) projectionMatrix
     * @param {KICK.math.mat4} modelViewMatrix
     * @param {KICK.math.mat4} modelViewProjectionMatrix modelviewMatrix multiplied with projectionMatrix
     */

    /**
     * Components with largest priority are invoked first. (optional - default 0). Cannot be modified after creation.
     * @property scriptPriority
     * @type Number
     */

    /**
     * Abstract method called every update. May be undefined.
     * @method update
     */

    /**
     * Abstract method called every update as the last thing. Useful for camera scripts. May be undefined.
     * @method lateUpdate
     */
//};

    /**
     * Position, rotation and scale of a game object. This component should not be created manually.
     * It is created when a GameObject is created.
     * @namespace KICK.scene
     * @class Transform
     * @extends KICK.scene.Component
     * @constructor
     * @param {KICK.scene.GameObject} gameObject
     */
    scene.Transform = function (gameObject) {
        var globalMatrix = null,
            localMatrix = null,
            localMatrixInverse = null,
            globalMatrixInverse = null,
            thisObj = this;

        this.gameObject = gameObject;
        /**
         * Local translation
         * @property localTranslation
         * @type KICK.math.vec3
         * @public
         */
        this.localTranslation = vec3.create([0,0,0]);
        /**
         * Local rotation in euler angles
         * @property localRotation
         * @type KICK.math.vec3
         * @public
         */
        this.localRotation = vec3.create([0,0,0]);
        /**
         * Local scale
         * @property localScaling
         * @type KICK.math.vec3
         * @public
         */
        this.localScaling = vec3.create([1,1,1]);
        /**
         * Array of children
         * @property children
         * @type KICK.scene.Transform
         * @public
         */
        this.children = [];
        /**
         *  array of children
         * @property parentTransform
         * @type KICK.scene.Transform
         * @public
         */
        this.parentTransform = null;

        /**
         * @method calculateGlobalMatrix
         * @private
         */
        var calculateGlobalMatrix = function () {
            globalMatrix = mat4.create();
            mat4.set(thisObj.getLocalMatrix(), globalMatrix);

            var transformIterator = thisObj.parentTransform;
            while (transformIterator !== null) {
                mat4.multiply(globalMatrix, transformIterator.getLocalMatrix(),globalMatrix);
                transformIterator  = transformIterator.parentTransform;
            }
        };

        /**
         * @method calculateGlobalMatrixInverse
         * @private
         */
        var calculateGlobalMatrixInverse = function () {
            globalMatrixInverse = mat4.create();
            mat4.set(thisObj.getLocalMatrixInverse(), globalMatrixInverse);
            var transformIterator = thisObj.parentTransform;
            while (transformIterator !== null) {
                mat4.multiply(globalMatrixInverse,transformIterator.getLocalMatrixInverse(),globalMatrixInverse);
                transformIterator  = transformIterator.parentTransform;
            }
        };

        /**
         * Set the parent to the object and register this to the parents child objects
         * @method setParent
         * @param newParent
         */
        this.setParent = function (newParent) {
            if (newParent === this) {
                throw new Error('Cannot assign parent to self');
            }
            this.parentTransform = newParent;
            newParent.children.push(this);
        };

        /**
         * @method getLocalMatrix
         * @return {mat4} local transformation
         */
        this.getLocalMatrix = function () {
            if (localMatrix === null) {
                localMatrix = mat4.create();
                mat4.identity(localMatrix);
                mat4.rotateX(localMatrix, this.localRotation[0]*degreeToRadian);
                mat4.rotateY(localMatrix, this.localRotation[1]*degreeToRadian);
                mat4.rotateZ(localMatrix, this.localRotation[2]*degreeToRadian);
                mat4.translate(localMatrix, this.localTranslation);
                mat4.scale(localMatrix, this.localScaling);
            }
            return localMatrix;
        };

        /**
         * Note this ignores scale
         * @method getLocalMatrixInverse
         * @return {mat4} inverse of local transformation
         */
        this.getLocalMatrixInverse = function () {
            if (localMatrixInverse === null) {
                localMatrixInverse = mat4.create();
                mat4.identity(localMatrixInverse);
                if (this.localRotation[0] !== 0.0) {
                    mat4.rotateX(localMatrixInverse, -this.localRotation[0]*degreeToRadian);
                }
                if (this.localRotation[1] !== 0.0) {
                    mat4.rotateY(localMatrixInverse, -this.localRotation[1]*degreeToRadian);
                }
                if (this.localRotation[2] !== 0.0 ) {
                    mat4.rotateZ(localMatrixInverse, -this.localRotation[2]*degreeToRadian);
                }
                mat4.translate(localMatrixInverse, [-this.localTranslation[0],-this.localTranslation[1],-this.localTranslation[2]]);
                // ignores scale, since it should currently not be used
            }
            return localMatrixInverse;
        };

        /**
         * @method getGlobalMatrix
         * @return {mat4} global transform
         */
        this.getGlobalMatrix = function () {
            if (globalMatrix === null) {
                calculateGlobalMatrix();
            }
            return globalMatrix;
        };

        /**
         * @method getGlobalMatrixInverse
         * @return {mat4} inverse global transform
         */
        this.getGlobalMatrixInverse = function () {
            if (globalMatrixInverse === null) {
                calculateGlobalMatrixInverse();
            }
            return globalMatrixInverse;
        };

        /**
         * @method getGlobalRotationMatrix
         * @return {mat4} inverse
         */
        this.getGlobalRotationMatrix = function () {
            var globalRotationMatrix = mat4.create();
            mat4.set(this.getGlobalMatrix(), globalRotationMatrix);
            // remove transforms
            globalRotationMatrix[12] = globalRotationMatrix[13] = globalRotationMatrix[14] = 0;
            return globalRotationMatrix;
        };

        /**
         * This method must be called after the transform has been updated
         * @method markUpdated
         */
        this.markUpdated = function () {
            globalMatrix = null;
            localMatrix = null;
            localMatrixInverse = null;
            globalMatrixInverse = null;

            for (var i=this.children.length-1;i>=0;i--) {
                this.children[i].markUpdated();
            }
        };
    };

    /**
     * A scene objects contains a list of GameObjects
     * @class Scene
     * @namespace KICK.scene
     * @constructor
     * @param engine {KICK.core.Engine}
     */
    scene.Scene = function (engine) {
        var gameObjects = [],
            gameObjectsNew = [],
            gameObjectsDelete = [],
            cameras = [],
            updateableComponents= [],
            lateUpdateableComponents = [],
            componentsNew = [],
            componentsDelete = [],
            componentListenes = [],
            i;

        /**
         * Compares two objects based on scriptPriority
         * @method sortByScriptPriority
         * @param a
         * @param b
         * @private
         */
        var sortByScriptPriority = function (a,b) {
            return a.scriptPriority-b.scriptPriority;
        };

        /**
         * Handle insertions and removal of gameobjects and components. This is done in a separate step to avoid problems
         * with missed updates (or multiple updates) due to modifying the array while iterating it.
         * @method cleanupGameObjects
         * @private
         */
        var cleanupGameObjects = function () {
            var i,
                component;
            if (gameObjectsNew.length > 0) {
                gameObjects = gameObjects.concat(gameObjectsNew);
                gameObjectsNew.length = 0;
            }
            if (gameObjectsDelete.length > 0) {
                core.Util.removeElementsFromArray(gameObjects,gameObjectsDelete);
                gameObjectsDelete.length = 0;
            }
            if (componentsNew.length > 0) {
                for (i = componentsNew.length-1; i >= 0; i--) {
                    component = componentsNew[i];
                    if (typeof(component.activated) === "function") {
                        component.activated();
                    }
                    if (typeof(component.update) === "function") {
                        core.Util.insertSorted(component,updateableComponents,sortByScriptPriority);
                    }
                    if (typeof(component.lateUpdate) === "function") {
                        core.Util.insertSorted(component,lateUpdateableComponents,sortByScriptPriority);
                    }
                }
                for (i=componentListenes.length-1; i >= 0; i--) {
                    componentListenes[i].componentsAdded(componentsNew);
                }
                componentsNew.length = 0;
            }
            if (componentsDelete.length > 0) {
                for (i = componentsDelete.length-1; i >= 0; i--) {
                    component = componentsDelete[i];
                    if (typeof(component.deactivated) === "function") {
                        component.deactivated();
                    }
                    if (typeof(component.update) === "function") {
                        core.Util.removeElementFromArray(updateableComponents,component);
                    }
                    if (typeof(component.lateUpdate) === "function") {
                        core.Util.removeElementFromArray(lateUpdateableComponents,component);
                    }
                }
                for (i=componentListenes.length-1; i >= 0; i--) {
                    componentListenes[i].componentsRemoved(componentsDelete);
                }
                componentsDelete.length = 0;
            }
        };

        /**
         * Add a component listener to the scene. A component listener should contain two functions:
         * {componentsAdded(components) and componentsRemoved(components)}.
         * Throws an exception if the two required functions does not exist.
         * @method addComponentListener
         * @param componentListener
         */
        this.addComponentListener = function (componentListener) {
            if (!scene.ComponentChangedListener.isComponentListener(componentListener) ) {
                throw {
                    name: "Error",
                    message:"Component listener does not have the correct interface. " +
                        "It should contain the two functions: " +
                        "componentsAdded(components) and componentsRemoved(components)"
                };
            }
            componentListenes.push(componentListener);
        }


        this.removeComponentListener = function (componentListener) {
            core.Util.removeElementFromArray(componentListenes,componentListener);
        }

        /**
         * Should only be called by GameObject when a component is added. If the component is updateable (implements
         * update or lateUpdate) the components is added to the current list of updateable components after the update loop
         * (so it will not recieve any update invocations in the current frame).
         * If the component is renderable (implements), is it added to the renderer's components
         * @method addComponent
         * @param {KICK.scene.Component} component
         * @protected
         */
        this.addComponent = function (component) {
            core.Util.insertSorted(component,componentsNew,sortByScriptPriority);
        };

        /**
         * @method removeComponent
         * @param {KICK.scene} component
         */
        this.removeComponent = function (component) {
            componentsDelete.push(component);
        }

        /**
         * Reference to the engine
         * @property engine
         * @type KICK.core.Engine
         * @public
         */
        Object.defineProperty(this,"engine",{
            value:engine
        });

        /**
         * @method loadScene
         * @param {String} jsonStr
         */
        this.loadScene = function (jsonStr) {
            throw Error("Not implemented");
        };

        /**
         * @method saveScene
         * @return {String} in jsonFormat
         */
        this.saveScene = function () {
            throw Error("Not implemented");
        };

        /**
         * @method createGameObject
         * @return {KICK.scene.GameObject}
         */
        this.createGameObject = function () {
            var gameObject = new scene.GameObject(this);
            gameObjectsNew.push(gameObject);
            return gameObject;
        };

        /**
         * @method destroyObject
         * @param {KICK.scene.GameObject} gameObject
         */
        this.destroyObject = function (gameObject) {
            gameObjectsDelete.push(gameObject);
        };

        /**
         * @method getNumberOfGameObjects
         * @return {Number} number of gameobjects
         */
        this.getNumberOfGameObjects = function () {
            return gameObjects.length;
        };

        /**
         * @method getGameObject
         * @param {Number} index
         * @return {KICK.scene.GameObject}
         */
        this.getGameObject = function (index) {
            return gameObjects[index];
        };

        /**
         * Called by engine every frame. Updates and render scene
         * @method update
         */
        this.update = function () {
            var i;
            for (i=updateableComponents.length-1; i >= 0; i--) {
                updateableComponents[i].update();
            }
            for (i=lateUpdateableComponents.length-1; i >= 0; i--) {
                lateUpdateableComponents[i].lateUpdate();
            }
            cleanupGameObjects();
        };

        this.addCamera = function (camera) {
            cameras.push(camera);
        }

        /**
         * @method debug
         */
        this.debug = function () {
            console.log("gameObjects "+gameObjects.length,gameObjects,
                "gameObjectsNew "+gameObjectsNew.length,gameObjectsNew,
                "gameObjectsDelete "+gameObjectsDelete.length,gameObjectsDelete,
                "cameras "+cameras.length,cameras
            );
        };
    };

    /**
     * Creates a game camera
     * @class Camera
     * @namespace KICK.scene
     * @extends KICK.scene.Component
     * @constructor
     * @param {Config} configuration with same properties as the Camera
     */
    scene.Camera = function (config) {
        var gl,
            thisObj = this,
            transform,
            isNumber = function (o) {
                return typeof (o) === "number";
            },
            isBoolean = function(o){
                return typeof (o) === "boolean";
            },
            setupViewport = function () {
                gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            },
            setupClear = function () {
                if (!thisObj._currentClearFlags) {
                    // I use '+' instead of '|' since it tends to perform better in JS
                    // and it should give the same result when the bit-fields are different (power of two)
                    thisObj._currentClearFlags = (thisObj.clearFlagColor ? gl.COLOR_BUFFER_BIT : 0) + (thisObj.clearFlagDepth ? gl.DEPTH_BUFFER_BIT : 0);
                }
                gl.clear(thisObj._currentClearFlags);
            },
            setupClearColor = function () {
                if (gl.currentClearColor !== thisObj.clearColor) {
                    gl.currentClearColor = thisObj.clearColor;
                    var color = thisObj.clearColor;
                    gl.clearColor(color[0], color[1], color[2], color[3]);
                }
            };

        this.activated = function(){
            var gameObject = this.gameObject;
            transform = gameObject.transform;
            gl = gameObject.engine.gl;
        };

        /**
         * Clear the screen and set the projectionMatrix and modelViewMatrix on the gl object
         * @method setupCamera
         * @param {KICK.math.mat4} projectionMatrix Projection of the camera
         * @param {KICK.math.mat4} modelViewMatrix Modelview of the camera (the inverse global transform matrix of the camera)
         * @param {KICK.math.mat4} modelViewProjectionMatrix modelview multiplied with projection
         */
        this.setupCamera = function (projectionMatrix,modelViewMatrix,modelViewProjectionMatrix) {
            setupViewport();
            setupClearColor();
            setupClear();

            if (this.cameraTypePerspective) {
                mat4.perspective(this.fieldOfView, gl.viewportWidth / gl.viewportHeight,
                    this.near, this.far, projectionMatrix);
            } else {
                mat4.ortho(this.left, this.right, this.bottom, this.top,
                    this.near, this.far, projectionMatrix);
            }

            // todo - this allocates a new mat4 - remove this
            var globalMatrixInv = transform.getGlobalMatrixInverse();
            mat4.set(globalMatrixInv, modelViewMatrix);

            mat4.multiply(modelViewMatrix,projectionMatrix,modelViewProjectionMatrix);
        };

        /**
         * Only used when perspective camera type. Default 60.0
         * @property fieldOfView
         * @type Number
         */
        this.fieldOfView = isNumber(config.fieldOfView) ? config.fieldOfView : 60;
        /**
         * Default 0.1
         * @property near
         * @type Number
         */
        this.near = isNumber(config.near) ? config.near : 0.1;
        /**
         * Default 1000.0
         * @property far
         * @type Number
         */
        this.far = isNumber(config.far) ? config.far : 1000;
        /**
         * Default true
         * @property cameraTypePerspective
         * @type Boolean
         */
        this.cameraTypePerspective = isBoolean(config.cameraTypePerspective) ? config.cameraType : true;
        /**
         * Only used when orthogonal camera type (!cameraTypePerspective)
         * @property left
         * @type Number
         */
        this.left = isNumber(config.left) ? config.left : -1;
        /**
         * Only used when orthogonal camera type (!cameraTypePerspective). Default 1
         * @property right
         * @type Number
         */
        this.right = isNumber(config.right) ? config.right : 1;
        /**
         * Only used when orthogonal camera type (!cameraTypePerspective). Default 1
         * @property bottom
         * @type Number
         */
        this.bottom = isNumber(config.bottom) ? config.bottom : -1;
        /**
         * Only used when orthogonal camera type (!cameraTypePerspective). Default 1
         * @property top
         * @type Number
         */
        this.top = isNumber(config.top) ? config.top : 1;
        /**
         * Only used when orthogonal camera type (!cameraTypePerspective). Default [1,1,1,1]
         * @property clearColor
         * @type Array
         */
        this.clearColor = config.clearColor ? config.clearColor : [1,1,1,1];
        /**
         * @property clearFlagColor
         * @type Boolean
         */
        this.clearFlagColor = config.clearFlagColor ? config.clearFlagColor:true;
        /**
         * @property clearFlagDepth
         * @type Boolean
         */
        this.clearFlagDepth = config.clearFlagDepth ? config.clearFlagDepth:true;

        this.setupClearFlags(config.clearColor,config.clearDepth);
    };

    /**
     * Reset the camera clear flags
     * @method setupClearFlags
     * @param {Boolean} clearColor
     * @param {Boolean} clearDepth
     */
    scene.Camera.prototype.setupClearFlags = function (clearColor,clearDepth) {
        this.clearColor = clearColor;
        this.clearDepth = clearDepth;
        delete this._currentClearFlags;
    };



    /**
     * Specifies the interface for a component listener.
     * Note that object only need to implement the methods componentsAdded and componentsRemoved.
     * @class ComponentChangedListener
     * @namespace KICK.scene
     */
    scene.ComponentChangedListener = {
        /**
         * @method componentsAdded
         * @param {Array ofKICK.scene.Components} components
         */
        /**
         * @method componentsRemoved
         * @param {Array ofKICK.scene.Components} components
         */
        /**
         * @method isComponentListener
         * @param {Object} obj
         * @static
         */
        isComponentListener: function (obj) {
            return obj &&
                typeof(obj.componentsAdded) === "function" &&
                typeof(obj.componentsRemoved) === "function";
        }
    };

    /**
     * Renders a Mesh.
     * To create custom renderable objects you should not inherit from this class, but simple create a component with a
     * render() method.
     * @class MeshRenderer
     * @namespace KICK.scene
     * @extends KICK.scene.Component
     * @final
     */
    scene.MeshRenderer = function () {
        var transform;

        this.activated = function(){
            transform = this.gameObject.transform;
        };
        
        /**
         * @property shader
         * @type KICK.material.Material
         */
        this.material = undefined;

        /**
         * This method may not be called (the renderer could make the same calls)
         * @method render
         * @param (KICK.math.mat4) projectionMatrix
         * @param {KICK.math.mat4} modelViewMatrix
         * @param {KICK.math.mat4} modelViewProjectionMatrix modelviewMatrix multiplied with projectionMatrix
         */
        this.render = function (projectionMatrix,modelViewMatrix,modelViewProjectionMatrix) {
            var mesh = this.mesh,
                material = this.material,
                shader = material.shader,
                globalTransform = transform.getGlobalMatrix ( );
            mesh.bind(shader);
            shader.bindUniform(material.uniforms);
            shader.bindMatrices(projectionMatrix,modelViewMatrix,modelViewProjectionMatrix,transform);
            mesh.render();
        };

        /**
         * @property mesh
         * @type KICK.scene.Mesh
         */
        this.mesh = undefined;
    };

    /**
     * Mesh data
     * @class Mesh
     * @namespace KICK.scene
     */
    scene.Mesh = function (engine,config) {
        var gl = engine.gl,
            meshVertexAttBuffer,
            meshVertexAttBufferDescription,
            meshVertexIndexBuffer,
            vertexAttributeNames = [],
            buffers = [],
            description,
            vertexAttrLength,
            matrixTemp = mat4.create();
        if (!config) {
            config = {
                name:"Mesh"
            };
        }
        /**
         * @property name
         * @type String
         */
        this.name = config.name?config.name:"Mesh";
        /**
         * @property vertex
         * @type Float32Array
         */
        this.vertex = config.vertex?new Float32Array(config.vertex):null;
        /**
         * @property normal
         * @type Float32Array
         */
        this.normal = config.normal?new Float32Array(config.normal):null;
        /**
         * @property uv1
         * @type Float32Array
         */
        this.uv1 = config.uv1?new Float32Array(config.uv1):null;
        /**
         * @property uv2
         * @type Float32Array
         */
        this.uv2 = config.uv2?new Float32Array(config.uv2):null;
        /**
         * A tangent is represented as vec4
         * @property tangent
         * @type Float32Array
         */
        this.tangent = config.tangent?new Float32Array(config.tangent):null;
        /**
         * @property color (RGBA)
         * @type Float32Array
         */
        this.color = config.color?new Float32Array(config.color):null;
        /**
         * @property indices
         * @type Uint16Array
         */
        this.indices = config.indices?new Uint16Array(config.indices):null;

        /**
         * @method createInterleavedData
         * @private
         */
        this.createInterleavedData = function () {
            var lengthOfVertexAttributes = [],
                names = [],
                length = 0,
                data,
                i,
                thisObj = this,
                vertexLen = this.vertex.length,
                index = 0,
                description = {},
                addAttributes = function (name,size){
                    if (thisObj[name]){
                        lengthOfVertexAttributes.push(size);
                        names.push(name);
                        description[name] = {
                            pointer: length*4,
                            size: size,
                            normalized: false,
                            type: gl.FLOAT
                        };
                        length += size;
                    }
                };

            addAttributes("vertex",3);
            addAttributes("normal",3);
            addAttributes("uv1",2);
            addAttributes("uv2",2);
            addAttributes("tangent",4);
            addAttributes("color",4);

            data = new Float32Array(length*vertexLen);
            for (i=0;i<vertexLen;i++){
                for (var j=0;j<names.length;j++){
                    var dataSrc = this[names[j]];
                    var dataSrcLen = lengthOfVertexAttributes[j];
                    for (var k=0;k<dataSrcLen;k++){
                        data[index++] = dataSrc[i*dataSrcLen+k];
                    }
                }
            }

            return {
                vertexAttrLength:length*4,
                description:description,
                data:data
            };
        };

        /**
         * This function verifies that the mesh has the vertex attributes (normals, uvs, tangents) that the shader uses.
         * @method verify
         * @param {KICK.material.Shader} shader
         * @return {Array} list of missing vertex attributes in mesh or null if no missing attributes
         */
        this.verify = function (shader){
            var missingVertexAttributes = [],
                found;
            for (var att in shader.lookupAttribute){
                if (typeof (att) === "string"){
                    found = false;
                    for (var i=0;i<vertexAttributeNames.length;i++){
                        if (vertexAttributeNames[i] === att){
                            found = true;
                            break;
                        }
                    }
                    if (!found){
                        missingVertexAttributes.push(att);
                    }
                }
            }
            if (missingVertexAttributes.length===0){
                return null;
            }
            return missingVertexAttributes;
        };

        /**
         * Bind the vertex attributes of the mesh to the shader
         * @method bind
         * @param {KICK.material.Shader} shader
         */
        this.bind = function (shader) {
            shader.bind();
            
            gl.bindBuffer(gl.ARRAY_BUFFER, meshVertexAttBuffer);

            for (var descName in meshVertexAttBufferDescription) {
                if (shader.lookupAttribute[descName] !== undefined) {
                    var desc = meshVertexAttBufferDescription[descName];
                    var attributeIndex = shader.lookupAttribute[descName];
                    gl.enableVertexAttribArray(attributeIndex);
                    gl.vertexAttribPointer(attributeIndex, desc.size,
                       desc.type, false, vertexAttrLength, desc.pointer);
                }
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshVertexIndexBuffer);
        };

        /**
         * @method render
         */
        this.render = function () {
            gl.drawElements(gl.TRIANGLES, meshVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
        }

        /**
         * @method updateData
         */
        this.updateData = function () {
            var names = ["vertex", "normal", "tangent","uv1","uv2","color"],
                dataLengths = [3,3,3,2,2,4],
                i, buffer, dataLength,
                interleavedData = this.createInterleavedData();
            meshVertexAttBufferDescription = interleavedData.description;
            vertexAttrLength = interleavedData.vertexAttrLength;
            // delete current buffers
            for (i=buffers.length-1; i >= 0; i--) {
                gl.deleteBuffer(buffers[i]);
            }
            if (typeof meshVertexIndexBuffer === "number"){
                gl.deleteBuffer(meshVertexIndexBuffer);
            }
            if (typeof meshVertexAttBuffer === "number"){
                gl.deleteBuffer(meshVertexAttBuffer);
            }

            vertexAttributeNames = [];
            buffers = [];

            for (i=names.length-1; i >= 0; i--) {
                var name = names[i],
                    data = this[name];
                if (data) {
                    buffer = gl.createBuffer();
                    dataLength = dataLengths[i];
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
                    buffer.itemSize = dataLength;
                    buffer.numItems = data.length / dataLength;
                    buffers.push(buffer);
                    vertexAttributeNames.push(name);
                }
            }

            meshVertexAttBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, meshVertexAttBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, interleavedData.data, gl.STATIC_DRAW);

            meshVertexIndexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshVertexIndexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
            meshVertexIndexBuffer.itemSize = 1;
            meshVertexIndexBuffer.numItems = this.indices.length;
        };

        this.updateData(); // always update data on load
    };

    /**
     * @method recalculateNormals
     */
    scene.Mesh.prototype.recalculateNormals = function(){
        var vertexCount = this.vertex.length/3,
            triangleCount = this.indices.length/3,
            triangles = this.indices,
            vertex = vec3.wrapArray(this.vertex),
            a,
            normalArrayRef = {},
            normalArray = vec3.array(vertexCount,normalArrayRef),
            v1v2 = vec3.create(),
            v1v3 = vec3.create(),
            normal = vec3.create();

        for (a=0;a<triangleCount;a++){
            var i1 = triangles[a*3+0],
                i2 = triangles[a*3+1],
                i3 = triangles[a*3+2],

                v1 = vertex[i1],
                v2 = vertex[i2],
                v3 = vertex[i3];
            vec3.subtract(v2,v1,v1v2);
            vec3.subtract(v3,v1,v1v3);
            vec3.cross(v1v2,v1v3,normal);
            vec3.normalize(normal);
            vec3.add(normalArray[i1],normal);
            vec3.add(normalArray[i2],normal);
            vec3.add(normalArray[i3],normal);
        }
        for (a=0;a<vertexCount;a++){
            vec3.normalize(normalArray[a]);
        }
        this.normal =  normalArrayRef.mem;
    };

    /**
     * Recalculates the tangents.
     * Algorithm is based on
     *   Lengyel, Eric. “Computing Tangent Space Basis Vectors for an Arbitrary Mesh”.
     *   Terathon Software 3D Graphics Library, 2001.
     *   http://www.terathon.com/code/tangent.html
     * @method recalculateTangents
     */
    scene.Mesh.prototype.recalculateTangents = function(){
        var vertex = vec3.wrapArray(this.vertex),
            vertexCount = vertex.length,
            normal = vec3.wrapArray(this.normal),
            texcoord = this.uv1,
            triangle = this.indices,
            triangleCount = triangle.length/3,
            tangent = this.tangent,
            tan1 = vec3.array(vertexCount),
            tan2 = vec3.array(vertexCount),
            a;

        for (a = 0; a < triangleCount; a++)
        {
            var i1 = triangle[a*3+0],
                i2 = triangle[a*3+1],
                i3 = triangle[a*3+2],

                v1 = vertex[i1],
                v2 = vertex[i2],
                v3 = vertex[i3],

                w1 = texcoord[i1],
                w2 = texcoord[i2],
                w3 = texcoord[i3],

                x1 = v2[0] - v1[0],
                x2 = v3[0] - v1[0],
                y1 = v2[1] - v1[1],
                y2 = v3[1] - v1[1],
                z1 = v2[2] - v1[2],
                z2 = v3[2] - v1[2],

                s1 = w2[0] - w1[0],
                s2 = w3[0] - w1[0],
                t1 = w2[1] - w1[1],
                t2 = w3[1] - w1[1],

                r = 1.0 / (s1 * t2 - s2 * t1),
                sdir = vec3.create([(t2 * x1 - t1 * x2) * r,
                    (t2 * y1 - t1 * y2) * r,
                    (t2 * z1 - t1 * z2) * r]),
                tdir = vec3.create([(s1 * x2 - s2 * x1) * r,
                    (s1 * y2 - s2 * y1) * r,
                    (s1 * z2 - s2 * z1) * r]);

            vec3.add(tan1[i1], sdir);
            vec3.add(tan1[i2], sdir);
            vec3.add(tan1[i3], sdir);

            vec3.add(tan2[i1], tdir);
            vec3.add(tan2[i2], tdir);
            vec3.add(tan2[i3], tdir);
        }
        if (!tangent){
            tangent = new Float32Array(vertexCount*4);
            this.tangent = tangent;
        }
        tangent = vec4.wrapArray(tangent);

        for (a = 0; a < vertexCount; a++)
        {
            var n = normal[a];
            var t = tan1[a];

            // Gram-Schmidt orthogonalize
            // tangent[a] = (t - n * Dot(n, t)).Normalize();
            var tmn = vec3.subtract(t,n,vec3.create());
            var d = vec3.dot(n,t,vec3.create());
            vec3.set(vec3.normalize(vec3.multiply(tmn,d)),tangent[a]);

            // Calculate handedness
            // tangent[a].w = (Dot(Cross(n, t), tan2[a]) < 0.0F) ? -1.0F : 1.0F;
            tangent[a][3] = (vec3.dot(vec3.cross(n, t,vec3.create()), tan2[a]) < 0.0) ? -1.0 : 1.0;
        }
    };
 })();