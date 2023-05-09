/* global wpforms_conditional_logic */
( function( $ ) {

	'use strict';

	var WPFormsConditionals = {

		/**
		 * Start the engine.
		 *
		 * @since 1.0.0
		 */
		init: function() {

			// Document ready.
			$( WPFormsConditionals.ready );

			WPFormsConditionals.bindUIActions();
		},

		/**
		 * Document ready.
		 *
		 * @since 1.1.2
		 */
		ready: function() {

			$( '.wpforms-form' ).each( function() {
				var $form = $( this );

				WPFormsConditionals.initDefaultValues( $form );
				WPFormsConditionals.processConditionals( $form, false );
			} );
		},

		/**
		 * Initialization of data-default-value attribute for each field.
		 *
		 * @since 1.5.5.1
		 *
		 * @param {object} $form The form DOM element.
		 */
		initDefaultValues: function( $form ) {
			$form.find( '.wpforms-conditional-field input, .wpforms-conditional-field select, .wpforms-conditional-field textarea' ).each( function() {

				var $field = $( this ),
					defval = $field.val(),
					type = $field.attr( 'type' ),
					tagName = $field.prop( 'tagName' );

				type = [ 'SELECT', 'BUTTON' ].indexOf( tagName ) > -1 ? tagName.toLowerCase() : type;

				switch ( type ) {
					case 'button':
					case 'submit':
					case 'reset':
					case 'hidden':
						break;
					case 'checkbox':
					case 'radio':
						if ( $field.is( ':checked' ) ) {
							$field.attr( 'data-default-value', 'checked' );
						}
						break;
					default:
						if ( defval !== '' ) {
							$field.attr( 'data-default-value', defval );
						}
						break;
				}
			} );
		},

		/**
		 * Element bindings.
		 *
		 * @since 1.0.0
		 */
		bindUIActions: function() {

			$( document ).on( 'change', '.wpforms-conditional-trigger input, .wpforms-conditional-trigger select', function() {
				WPFormsConditionals.processConditionals( $( this ), true );
			} );

			$( document ).on( 'input', '.wpforms-conditional-trigger input[type=text], .wpforms-conditional-trigger input[type=email], .wpforms-conditional-trigger input[type=url], .wpforms-conditional-trigger input[type=number], .wpforms-conditional-trigger textarea', function() {
				WPFormsConditionals.processConditionals( $( this ), true );
			} );

			$( '.wpforms-form' ).submit( function() {
				WPFormsConditionals.resetHiddenFields( $( this ) );
			} );
		},

		/**
		 * Reset any form elements that are inside hidden conditional fields.
		 *
		 * @since 1.0.0
		 *
		 * @param {object} el The form.
		 */
		resetHiddenFields: function( el ) {

			if ( window.location.hash && '#wpformsdebug' === window.location.hash ) {
				console.log( 'Resetting hidden fields...' );
			}

			var $form = $( el ),
				$field, type, tagName;

			$form.find( '.wpforms-conditional-hide :input' ).each( function() {

				$field  = $( this ),
				type    = $field.attr( 'type' ),
				tagName = $field.prop( 'tagName' );

				type = [ 'SELECT', 'BUTTON' ].indexOf( tagName ) > -1 ? tagName.toLowerCase() : type;

				switch ( type ) {
					case 'button':
					case 'submit':
					case 'reset':
					case 'hidden':
						break;
					case 'checkbox':
					case 'radio':
						$field.closest( 'ul' ).find( 'li' ).removeClass( 'wpforms-selected' );
						if ( $field.is( ':checked' ) ) {
							$field.prop( 'checked', false ).trigger( 'change' );
						}
						break;
					case 'select':
						WPFormsConditionals.resetHiddenSelectField.init( $field );
						break;
					default:
						if ( $field.val() !== '' ) {
							if ( $field.hasClass( 'dropzone-input' ) && $( '[data-name="' + $field[0].name + '"]', $form )[0] ) {
								$( '[data-name="' + $field[0].name + '"]', $form )[0].dropzone.removeAllFiles( true );
							}

							$field.val( '' ).trigger( 'input' );
						}
						break;
				}
			} );
		},

		/**
		 * Reset select elements inside conditionally hidden fields.
		 *
		 * @since 1.6.1.1
		 *
		 * @type {object}
		 */
		resetHiddenSelectField: {

			/**
			 * Select field jQuery DOM element.
			 *
			 * @since 1.6.1.1
			 *
			 * @type {jQuery}
			 */
			$field: null,

			/**
			 * Initialize the resetting logic for a select field.
			 *
			 * @since 1.6.1.1
			 *
			 * @param {jQuery} $field Select field jQuery DOM element.
			 */
			init: function( $field ) {

				this.$field = $field;

				if ( $field.data( 'choicesjs' ) ) {
					this.modern();
				} else {
					this.classic();
				}
			},

			/**
			 * Reset modern select field.
			 *
			 * @since 1.6.1.1
			 */
			modern: function() {

				var choicesjsInstance = this.$field.data( 'choicesjs' ),
					selectedChoices   = choicesjsInstance.getValue( true );

				// Remove all selected choices or items.
				if ( selectedChoices && selectedChoices.length ) {
					choicesjsInstance.removeActiveItems();
					this.$field.trigger( 'change' );
				}

				// Show a placeholder input for a modern multiple select.
				if ( this.$field.prop( 'multiple' ) ) {
					$( choicesjsInstance.input.element ).removeClass( choicesjsInstance.config.classNames.input + '--hidden' );
					return;
				}

				// Set a placeholder option like a selected value for a modern single select.
				var placeholder = choicesjsInstance.config.choices.filter( function( choice ) {

					return choice.placeholder;
				} );

				if ( Array.isArray( placeholder ) && placeholder.length ) {
					choicesjsInstance.setChoiceByValue( placeholder[ 0 ].value );
				}
			},

			/**
			 * Reset classic select field.
			 *
			 * @since 1.6.1.1
			 */
			classic: function() {

				var placeholder   = this.$field.find( 'option.placeholder' ),
					selectedIndex = placeholder.length ? 0 : -1; // The value -1 indicates that no element is selected.

				if ( selectedIndex !== this.$field.prop( 'selectedIndex' ) ) {
					this.$field.prop( 'selectedIndex', selectedIndex ).trigger( 'change' );
				}
			},
		},

		/**
		 * Reset form elements to default values.
		 *
		 * @since 1.5.5.1
		 * @since 1.6.1 Changed resetting process for select element.
		 *
		 * @param {object} $fieldContainer The field container.
		 */
		resetToDefaults: function( $fieldContainer ) {

			$fieldContainer.find( ':input' ).each( function() {

				var $field = $( this ),
					defval = $field.attr( 'data-default-value' ),
					type = $field.attr( 'type' ),
					tagName = $field.prop( 'tagName' );

				if ( defval === undefined ) {
					return;
				}

				type = [ 'SELECT', 'BUTTON' ].indexOf( tagName ) > -1 ? tagName.toLowerCase() : type;

				switch ( type ) {
					case 'button':
					case 'submit':
					case 'reset':
					case 'hidden':
						break;
					case 'checkbox':
					case 'radio':
						if ( defval === 'checked' ) {
							$field.prop( 'checked', true ).closest( 'li' ).addClass( 'wpforms-selected' );
							$field.trigger( 'change' );
						}
						break;
					case 'select':
						var choicesjsInstance = $field.data( 'choicesjs' );

						defval = defval.split( ',' );

						// Determine if it modern select.
						if ( ! choicesjsInstance ) {
							if ( $field.val() !== defval ) {
								$field.val( defval ).trigger( 'change' );
							}

						} else {

							// Filter placeholder options (remove empty values).
							defval = defval.filter( function( val ) {
								return '' !== val;
							} );

							if ( choicesjsInstance.getValue( true ) !== defval ) {
								choicesjsInstance.setChoiceByValue( defval );
								$field.trigger( 'change' );
							}
						}
						break;
					default:
						if ( $field.val() !== defval ) {
							$field.val( defval ).trigger( 'input' );
						}
						break;
				}
			} );
		},

		/**
		 * Process conditionals for a form.
		 *
		 * @since 1.0.0
		 * @since 1.6.1 Changed a conditional process for select element - multiple support.
		 *
		 * @param {element} el Any element inside the targeted form.
		 * @param {boolean} initial Initial run of processing.
		 *
		 * @returns {boolean} Returns false if something wrong.
		 */
		processConditionals: function( el, initial ) {

			var $this   = $( el ),
				$form   = $this.closest( '.wpforms-form' ),
				formID  = $form.data( 'formid' ),
				hidden  = false;

			if ( typeof wpforms_conditional_logic === 'undefined' || typeof wpforms_conditional_logic[formID] === 'undefined' ) {
				return false;
			}

			var fields = wpforms_conditional_logic[formID];

			// Fields.
			for ( var fieldID in fields ) {
				if ( ! fields.hasOwnProperty( fieldID ) ) {
					continue;
				}

				if ( window.location.hash && '#wpformsdebug' === window.location.hash ) {
					console.log( 'Processing conditionals for Field #' + fieldID + '...' );
				}

				var field  = fields[fieldID].logic,
					action = fields[fieldID].action,
					pass   = false;

				// Groups.
				for ( var groupID in field ) {
					if ( ! field.hasOwnProperty( groupID ) ) {
						continue;
					}

					var group      = field[groupID],
						pass_group = true;

					// Rules.
					for ( var ruleID in group ) {
						if ( ! group.hasOwnProperty( ruleID ) ) {
							continue;
						}

						var rule      = group[ruleID],
							val       = '',
							pass_rule = false,
							left      = '',
							right     = '';

						if ( window.location.hash && '#wpformsdebug' === window.location.hash ) {
							console.log( rule );
						}

						if ( ! rule.field ) {
							continue;
						}

						val = WPFormsConditionals.getElementValueByRule( rule, $form );

						if ( null === val ) {
							val = '';
						}

						left  = $.trim( val ).toString().toLowerCase();
						right = $.trim( rule.value ).toString().toLowerCase();

						switch ( rule.operator ) {
							case '==' :
								pass_rule = ( left === right );
								break;
							case '!=' :
								pass_rule = ( left !== right );
								break;
							case 'c' :
								pass_rule = ( left.indexOf( right ) > -1 && left.length > 0 );
								break;
							case '!c' :
								pass_rule = ( left.indexOf( right ) === -1 && right.length > 0 );
								break;
							case '^' :
								pass_rule = ( left.lastIndexOf( right, 0 ) === 0 );
								break;
							case '~' :
								pass_rule = ( left.indexOf( right, left.length - right.length ) !== -1 );
								break;
							case 'e' :
								pass_rule = ( left.length === 0 );
								break;
							case '!e' :
								pass_rule = ( left.length > 0 );
								break;
							case '>' :
								left      = left.replace( /[^-0-9.]/g, '' );
								pass_rule = ( '' !== left ) && ( WPFormsConditionals.floatval( left ) > WPFormsConditionals.floatval( right ) );
								break;
							case '<' :
								left      = left.replace( /[^-0-9.]/g, '' );
								pass_rule = ( '' !== left ) && ( WPFormsConditionals.floatval( left ) < WPFormsConditionals.floatval( right ) );
								break;
						}

						if ( ! pass_rule ) {
							pass_group = false;
							break;
						}
					}

					if ( pass_group ) {
						pass = true;
					}
				}

				if ( window.location.hash && '#wpformsdebug' === window.location.hash ) {
					console.log( 'Result: ' + pass );
				}

				if ( ( pass && action === 'hide' ) || ( ! pass && action !== 'hide' ) ) {
					$form
						.find( '#wpforms-' + formID + '-field_' + fieldID + '-container' )
						.hide()
						.addClass( 'wpforms-conditional-hide' )
						.removeClass( 'wpforms-conditional-show' );
					hidden = true;
				} else {
					var $fieldContainer = $form.find( '#wpforms-' + formID + '-field_' + fieldID + '-container' );
					if (
						$this.closest( '.wpforms-field' ).attr( 'id' ) !== $fieldContainer.attr( 'id' ) &&
						$fieldContainer.hasClass( 'wpforms-conditional-hide' )
					) {
						WPFormsConditionals.resetToDefaults( $fieldContainer );
					}
					$fieldContainer
						.show()
						.removeClass( 'wpforms-conditional-hide' )
						.addClass( 'wpforms-conditional-show' );
				}

				$( document ).trigger( 'wpformsProcessConditionalsField', [ formID, fieldID, pass, action ] );
			}

			if ( hidden ) {
				WPFormsConditionals.resetHiddenFields( $form );
				if ( initial ) {
					if ( window.location.hash && '#wpformsdebug' === window.location.hash ) {
						console.log( 'Final Processing' );
					}
					WPFormsConditionals.processConditionals( $this, false );
				}
			}

			$( document ).trigger( 'wpformsProcessConditionals', [ $this, $form, formID ] );
		},

		/**
		 * Retrieve an element value by rule.
		 *
		 * @since 1.6.1
		 *
		 * @param {object} rule  Rule for checking.
		 * @param {object} $form Current form.
		 *
		 * @returns {boolean|string} Element value.
		 */
		getElementValueByRule: function( rule, $form ) {
			var value = '';
			var field = $form.find( '#wpforms-' + $form.data( 'formid' ) + '-field_' + rule.field );

			// If we have the modern select enabled, we trim the rule value to match the trim that happens.
			if ( field.data( 'choicesjs' ) ) {
				rule.value = $.trim( rule.value );
			}

			if ( rule.operator === 'e' || rule.operator === '!e' ) {
				value = WPFormsConditionals.getElementValueByEmptyTypeRules( rule, $form );

			} else {
				value = WPFormsConditionals.getElementValueByOtherTypeRules( rule, $form );
			}

			return value;
		},

		/**
		 * Retrieve an element value if has empty type rules (e, !e).
		 *
		 * @since 1.6.1
		 *
		 * @param {object} rule  Rule for checking.
		 * @param {object} $form Current form.
		 *
		 * @returns {boolean|string} Element value.
		 */
		getElementValueByEmptyTypeRules: function( rule, $form ) {
			var formID = $form.data( 'formid' ),
				val    = '',
				$check, activeSelector;

			rule.value = '';

			if ( [
				'radio',
				'checkbox',
				'select',
				'payment-multiple',
				'payment-checkbox',
				'rating',
				'net_promoter_score',
			].indexOf( rule.type ) > -1 ) {
				activeSelector = ( 'select' === rule.type ) ? 'option:selected:not(.placeholder)' : 'input:checked';
				$check = $form.find( '#wpforms-' + formID + '-field_' + rule.field + '-container ' + activeSelector );

				if ( $check.length ) {
					val = true;
				}
			} else {

				val = $form.find( '#wpforms-' + formID + '-field_' + rule.field ).val();

				if ( ! val ) {
					val = '';
				}
			}

			return val;
		},

		/**
		 * Retrieve an element value if has NOT empty type rules (e, !e).
		 *
		 * @since 1.6.1
		 *
		 * @param {object} rule  Rule for checking.
		 * @param {object} $form Current form.
		 *
		 * @returns {boolean|string} Element value.
		 */
		getElementValueByOtherTypeRules: function( rule, $form ) {
			var formID = $form.data( 'formid' ),
				val    = '',
				$check, activeSelector;

			if ( [
				'radio',
				'checkbox',
				'select',
				'payment-multiple',
				'payment-checkbox',
				'rating',
				'net_promoter_score',
			].indexOf( rule.type ) > -1 ) {
				activeSelector = ( 'select' === rule.type ) ? 'option:selected:not(.placeholder)' : 'input:checked';
				$check = $form.find( '#wpforms-' + formID + '-field_' + rule.field + '-container ' + activeSelector );

				if ( $check.length ) {
					var escapeVal;

					$.each( $check, function() {
						escapeVal = WPFormsConditionals.escapeText( $( this ).val() );

						if ( [ 'checkbox', 'payment-checkbox', 'select' ].indexOf( rule.type ) > -1 ) {
							if ( rule.value === escapeVal ) {
								val = escapeVal;
							}
						} else {
							val = escapeVal;
						}
					} );
				}

			} else { // text, textarea, number.

				val = $form.find( '#wpforms-' + formID + '-field_' + rule.field ).val();

				if ( [ 'payment-select' ].indexOf( rule.type ) > -1 ) {
					val = WPFormsConditionals.escapeText( val );
				}
			}

			return val;
		},

		/**
		 * Escape text similar to PHP htmlspecialchars().
		 *
		 * @since 1.0.5
		 *
		 * @param {string} text Text to escape.
		 *
		 * @returns {string|null} Escaped text.
		 */
		escapeText: function( text ) {

			if ( null == text || ! text.length ) {
				return null;
			}

			var map = {
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				'\'': '&#039;',
			};

			return text.replace( /[&<>"']/g, function( m ) {
				return map[ m ];
			} );
		},

		/**
		 * Parse float. Returns 0 instead of NaN. Similar to PHP floatval().
		 *
		 * @since 1.4.7.1
		 *
		 * @param {mixed} mixedVar Probably string.
		 *
		 * @returns {float} parseFloat
		 */
		floatval: function( mixedVar ) {

			return ( parseFloat( mixedVar ) || 0 );
		},
	};

	WPFormsConditionals.init();

	window.wpformsconditionals = WPFormsConditionals;

}( jQuery ) );
