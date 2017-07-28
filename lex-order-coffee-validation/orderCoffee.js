'use strict' ;

const lexResponses = require('./lexResponses');
const databaseManager = require('./databaseManager');


const types = ['latte', 'americano', 'cappuccino', 'espresso'];
const sizes = ['small', 'large'];

function buildValidationResult(isValid, violatedSlot, messageContent) {
  if (messageContent == null) {
    return {
      isValid,
      violatedSlot
    };
  }
  return {
    isValid,
    violatedSlot,
    message: { contentType: 'PlainText', content: messageContent }
  };
}


function buildUserFavoriteResult(coffee, size, messageContent) {
  return {
    coffee,
    size,
    message: { contentType: 'PlainText', content: messageContent }
  };
}

function validateCoffeeOrder(coffeeType, coffeeSize) {
  if (coffeeType && types.indexOf(coffeeType.toLowerCase()) === -1) {
    return buildValidationResult(false, 'coffee', 'We do not have '+coffeeType+', would you like a different type of coffee?  Our most popular coffee is americano.');
  }

  if (coffeeSize && sizes.indexOf(coffeeSize.toLowerCase()) === -1) {
    return buildValidationResult(false, 'size', 'We do not have '+coffeeSize+', would you like a different size of coffee? Our most popular size is small.');
  }

  if (coffeeType && coffeeSize) {
    //Latte and cappuccino can be small or large
    if ((coffeeType.toLowerCase() === 'cappuccino' || coffeeType.toLowerCase() === 'latte' || coffeeType.toLowerCase() === 'expresso') && !(coffeeSize.toLowerCase() === 'small' || coffeeSize.toLowerCase() === 'large')) {
      return buildValidationResult(false, 'size', 'We do not have '+coffeeType+' in that size. small or large are the available sizes for that drink.');
    }

    //Americano is always small
    if (coffeeType.toLowerCase() === 'americano' && coffeeSize.toLowerCase() !== 'small') {
      return buildValidationResult(false, 'size', 'We do not have '+coffeeType+' in that size. small is the available size for that drink.');
    }
  }

  return buildValidationResult(true, null, null);
}





function buildFulfilmentResult(fullfilmentState, messageContent) {
  return {
    fullfilmentState,
    message: { contentType: 'PlainText', content: messageContent }
  };
}

function fullfilOrder(coffeeType, coffeeSize) {
console.log('fulfillOrder'+ coffeeType +' ' + coffeeSize);

  return databaseManager.saveOrderToDatabase(coffeeType, coffeeSize).then( (item) => {
    console.log(item.orderId);
    return buildFulfilmentResult('Fulfilled', 'Thanks, your orderid '+item.orderId+' has been placed and will be ready for pickup in the bar');
  });
}








function findUserFavorite(userId) {
  return databaseManager.findUserFavorite(userId).then(item => {
    return buildUserFavoriteResult(item.drink, item.size, 'Would you like to order a ${item.size} ${item.drink}?');
  });
}






module.exports = function(intentRequest,callback) {
	var coffeeType = intentRequest.currentIntent.slots.coffee;
	var coffeeSize = intentRequest.currentIntent.slots.size;
	console.log('You ordered: '+coffeeType + ' ' + coffeeSize);
	const source = intentRequest.invocationSource;
	if(source === 'DialogCodeHook') {

	const slots = intentRequest.currentIntent.slots;
	const validationResult = validateCoffeeOrder( coffeeType, coffeeSize);

	if(!validationResult.isValid){
	slots[validationResult.violatedSlot] = null;
	callback(lexResponses.elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
	
	return;
	}


//If size is not define then set it as small
    if (coffeeSize == null) {
      intentRequest.currentIntent.slots.size = 'small';
    }



	callback(lexResponses.delegate(intentRequest.sessionAttributes, intentRequest.currentIntent.slots));
	return;
	}


	if(source === 'FulfillmentCodeHook') {
	console.log('FulfillmentCodeHook');
	return fullfilOrder(coffeeType, coffeeSize).then(fullfiledOrder => {
	callback(lexResponses.close(intentRequest.sessionAttribute, fullfiledOrder.fullfilmentState, fullfiledOrder.message));
	return;
});
	

	callback(lexResponses.close(intentRequest.sessionAttributes, 'Fulfilled', {contentType:'PlainText', content: 'Order was placed'}));


}

}

/*

const handleDialogCodeHook = require('./manageDialogs');
const handleFulfillmentCodeHook = require('./manageFullfilment');

module.exports = function(intentRequest) {
  const source = intentRequest.invocationSource;

  if (source === 'DialogCodeHook') {
    return handleDialogCodeHook(intentRequest);
  }

  if (source === 'FulfillmentCodeHook') {
    return handleFulfillmentCodeHook(intentRequest);
  }
};
*/
