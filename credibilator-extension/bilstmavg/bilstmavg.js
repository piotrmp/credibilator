class Lambda extends tf.layers.Layer {
	constructor(config) {
		super(config);
		this.supportsMasking = false;
		this.output_shape=config.outputShape
	}

	computeOutputShape(inputShape) {
		if (inputShape[0]==null){
			return [null].concat(this.output_shape)
		}
		var items=1
		for (var i = 0; i < inputShape.length; i++){
			items=items*inputShape[i]
		}
		for (var i = 0; i < this.output_shape.length; i++){
			items=items/this.output_shape[i]
		}
		//console.log("from")
		//console.log(inputShape)
		//console.log("to")
		//console.log([items].concat(this.output_shape))
		return [items].concat(this.output_shape)
	}

	call(inputs, kwargs) {
		let input = inputs;
		if (Array.isArray(input)) {
			input = input[0];
		}
		this.invokeCallHook(inputs, kwargs);
		const origShape = input.shape;
		const flatShape = this.computeOutputShape(origShape)
		const flattened = input.reshape(flatShape);
		return flattened;
	}

	/**
	 * If a custom layer class is to support serialization, it must implement
	 * the `className` static getter.
	 */
	static get className() {
		return 'Lambda';
	}
}
tf.serialization.registerClass(Lambda);	// Needed for serialization.
tf.setBackend('cpu')
