define(['jquery', 'lib/components/base/modal'], function($, Modal){
	var CustomWidget = function () {
		var self = this,
		system = self.system(), 
		widgetTca = 'amo_bizandsoft_leads',
		widgetPath = 'bs-leads', 
		widget_name = 'bs-leads',
		currentUser = $('.n-avatar').first().attr('id'), 
		serverName = 'leads.bizandsoft.ru';

		self.widgetTca = widgetTca;
		
		var api = (function ($) {
			return {
				getPayment: function () { // проверяет оплату виджета
					return new Promise(function (resolve , reject) {
						$.ajax({
							url: 'https://' + serverName + '/' + widgetPath + '/partials/check_payment.php', // путь к файл изменить на свой
							method: 'POST',
							dataType: 'json',
							data: {
								'subdomain':AMOCRM.constant('account').subdomain,
							},
							success: function(response) {
							  resolve(response);
							},
							error: function(err) {
							  reject(err);
							}
						});
					} )
				},
				paymentForm: function (phone) { // отправляет данные из формы с номером тел (кнопка - служба поддержки)
					return new Promise(function (resolve , reject) {
						$.ajax({
							url: 'https://' + serverName + '/' + widgetPath + '/partials/paymentForm.php', // путь к файл изменить на свой
							method: 'POST',
							dataType: 'json',
							data: {
								'phone': phone,
								'subdomain': AMOCRM.constant('account').subdomain,
								'login': AMOCRM.constant('user').login,
								'timezone': AMOCRM.system.timezone,
								'lang': AMOCRM.lang_id,
							},
							success: function(response) {
							  resolve(response);
							},
							error: function(err) {
							  reject(err);
							}
						});
					} )
				},
				getRates: function (widget, rate_name) { // загружает тарифы
					return new Promise(function (resolve , reject) {
						$.ajax({
							url: 'https://payamo.bizandsoft.ru/rate.php', // не меняем
							method: 'POST',
							dataType: 'json',
							data: {
								'widget': widget,
								'rate_name' : rate_name
							},
							success: function(response) {
							  resolve(response);
							},
							error: function(err) {
							  reject(err);
							}
						});
					} )
				},
				payment: function (rate) { // получает ссылку на страницы оплаты юкассы
					return new Promise(function (resolve, reject) {
						$.ajax({
							url: 'https://payamo.bizandsoft.ru/payment.php', // не меняем
							method: 'POST',
							dataType: 'json',
							data: {
								'subdomain': AMOCRM.constant('account').subdomain,
								'widget': widgetPath,
								'rate': rate,
								'rate_name' : 'default'
							},
							success: function (response) {
								resolve(response);
							},
							error: function (err) {
								reject(err);
							}
						});
					});
				},
				online: function (users) { // отправляет кто онлайн
					return new Promise(function (resolve, reject) {
						$.ajax({
                            url: 'https://' + serverName + '/' + widgetPath + '/partials/online.php', // не меняем
                            method: 'POST',
                            dataType: 'json',
                            data: {
								'subdomain': AMOCRM.constant('account').subdomain,
								'users': users,
							},
							success: function (response) {
								resolve(response);
							},
							error: function (err) {
								reject(err);
							}
						});
					});
				},
				newOrder: function (data) {
                    return new Promise(function (resolve , reject) {
                        self.$authorizedAjax({
                            url: 'https://payamo.bizandsoft.ru/new_order.php',
                            method: 'POST',
                            dataType: 'json',
							data: data,
                            success: function(response) {
                              resolve(response);
                            },
                            error: function(err) {
                              reject(err);
                            }
                        });
                    } )
                }
			}
		})($);
		
		
		self.setCookie =	function(name, value, options = {})
		{
			options.path= '/';
			options.domain= system.subdomain+'.amocrm.ru';

			if (options.expires>0) {
				var date=new Date();
				date.setTime(date.getTime() + (options.expires*1000));
				options.expires = date.toUTCString();
			}

			var updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

			for (var optionKey in options) {
				updatedCookie += "; " + optionKey;
				var optionValue = options[optionKey];
				if (optionValue !== true) {
					updatedCookie += "=" + optionValue;
				}
			}

				document.cookie = updatedCookie;
		}

		self.getCookie = function(name) {
				var matches = document.cookie.match(new RegExp(
				"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
				));
				return matches ? decodeURIComponent(matches[1]) : undefined;
		}

		self.isJson = function (item) {
			item = typeof item !== "string"
					? JSON.stringify(item)
					: item;

			try {
					item = JSON.parse(item);
			} catch (e) {
					return false;
			}

			if (typeof item === "object" && item !== null) {
					return true;
			}

			return false;
		}

		this.getTemplate = function (template, callback) {
			template = template || '';

			return self.render({
				href : '/templates/' + template + '.twig',
				base_path : self.params.path,
				load : callback
			});
		};


		this.callbacks = {
			settings: function($modalBody){

				$('#'+widgetTca+'_custom').val(2);
				
				const installState = self.get_install_status();
				if (installState == 'install' || installState == 'not_configured') {
					$modalBody.find('.widget_settings_block__descr').before('<div class="' + 
					widgetTca + '-section_warning">' + self.i18n('interface').wdg_not_active + '</div>');
				}

				var modal = '<div class="payment-modal">';
					modal += '<div class="payment-form">';
						modal += '<p>Оставьте контактный номер телефона, мы свяжемся с Вами и расскажем как можно оплатить подписку на виджет!</p>'
						modal += '<div class="payment-form-block">';
						modal += self.render(
							{ ref: '/tmpl/controls/input.twig' },
							{   
								class_name: widgetTca + '_phone',
								name: 'phone',
								placeholder: '+79991234567',
							}
						);
						modal += self.render(
							{ ref: '/tmpl/controls/button.twig' },
							{
								class_name: widgetTca + '_button-input_green',
								text: 'Отправить',
								type: 'button'
							});
						modal += '</div>';
						modal += '</div>';
						modal += '<div class="'+widgetTca+'_overlay"></div>';
					modal += '</div>';
				
				var pay_banner  = '<div class="widget_settings_block__item_field">';
					pay_banner += '<div class="widget_settings_block__title_field">';
						pay_banner += '<div class="pay_banner">';
							pay_banner += '<span class="subscribe">Остались вопросы или пожелания?</span>';
							pay_banner += '<span class="payment-modal-show">Служба поддержки</span>';
						pay_banner += '</div>';
					pay_banner += '</div>';
				pay_banner += '</div>';
					
				$('#widget_settings__fields_wrapper .widget_settings_block__controls_top').before( pay_banner );
				$('.widget-settings .widget-settings__wrap-desc-space').append(modal);

				// отображаем модальное окно 
				$('.payment-modal-show').on('click', function(){
					$('.payment-modal').addClass('show');
					$('.'+widgetTca+'_phone').focus();
				});

				// скрываем модальное окно
				$('.'+widgetTca+'_overlay').on('click', function(){
					$('.payment-modal').removeClass('show');
				});

				// отправляем данные из формы с номером тел
				$('.payment-modal button').on('click', function(){
					var phone = $(this).parents('.payment-form-block').find('input[name=phone]');
					if(phone.val().length > 6){
						api.paymentForm(phone.val()).then(function(response){
							if(response.status){
								$('.payment-form-block').remove();
								$('.payment-form p').html(response.message);
							}
							phone.val('');
						});
					}else{
						phone.effect( "shake", { 
							direction: 'down', 
							times: 3, 
							distance: 3
							}, 500
						);
					}
				});
	
				api.getRates(widget_name, 'full').then(function (data) {
					var rate_html = '<div class="rate_name">';

						rate_html += '<label for="rate_name">Тариф</label>';

						rate_html += self.render(
							{ ref: '/tmpl/controls/select.twig' },
							{ items: [
								{
									id: 'default',
									option: 'Стандартный',
								},{
									id: 'full',
									option: 'Расширенный',
								}
							],      
							name: 'rate_name',
							selected: 'full'
							}
						);

					rate_html += '</div>';

					rate_html += '<div class="rates_container">';
						rate_html += '<div class="rates_wrapper" style="width: 396px;">';
						var url = '';
						var period_text = '';
						var i = 0;
						var data_length = (Object.keys(data).length);

						if(data_length){
							data_length--;
							$.each(data, function(month, rate){
								if(month == 3){
									period_text = month + ' месяца'
								}else if(month == 6){
									period_text = month + ' месяцев'
								}else if(month == 12){
									period_text = '1 год';
								}else if(month == 24){
									period_text = '2 года';
								}
								url = 'https://payamo.bizandsoft.ru/payment.php?subdomain=' + AMOCRM.constant('account').subdomain + '&widget=' + widget_name + '&rate=' + month + '&rate_name=full';

								rate_html += '<div class="item_rate ' + ( (data_length == i) ? 'selected' : '' ) + ' " data-months="'+month+'" style="left: '+(i*132)+'px;">';
									rate_html += '<span class="rate_period">'+ period_text +'</span>';
									rate_html += '<span class="rate__icon"></span>';
									rate_html += '<div class="rate__prices">';
										rate_html += '<span class="rate__gift">'+rate.gift+'</span>';
										rate_html += '<span class="rate__price">'+rate.price+' ₽</span>';
									rate_html += '</div>';
								rate_html += '</div>';
								i++;
							});
						}
						rate_html += '<div class="rate_selector" style="left: '+(data_length*132)+'px;"></div>';
						rate_html += '</div>';
					rate_html += '</div>';

					var payment_class = '';
					var payment_date = 'Загрузка';	
					var payment_model = 'free';
	
					api.getPayment().then(function (data) {
	
						payment_class = data.class;
						payment_date = data.date_end;
						payment_model = data.payment_model;
	
						var btn_pay  = '<div class="widget_settings_block__item_field">';
								btn_pay += '<div class="widget_settings_block__title_field">';
									btn_pay += '<div class="btn_pay_'+widgetTca+'">';
										btn_pay += '<span class="subscribe '+payment_class+'">' + payment_date + '</span>';
										btn_pay += '<a href="' + url + '" target="blank" class="button-input_blue">Оформить заказ</a>';
									btn_pay += (payment_model === 'free') ? '</div>' : '';
								btn_pay += '</div>';
							btn_pay += '</div>';

							var currency  = '<div class="currency_container_'+widgetTca+'">';
							currency += '<div class="title_'+widgetTca+'">Валюта для оплаты</div>';
							currency += self.render( 
								{ ref: '/tmpl/controls/select.twig' },
								{
									items: [
										{
											id: 'RUB',
											option: 'Рубль',
										},{
											id: 'KZT',
											option: 'Тенге',
										},{
											id: 'USD',
											option: 'Доллар',
										},{
											id: 'EUR',
											option: 'Евро',
										}
									],      
									id: 'currency_select_'+widgetTca,   
									class_name: 'currency_select_'+widgetTca,
									name: 'form[currency]',
								}
							);
						currency += '</div>';

						var currency_phone_container = '<div class="currency_phone_container_'+widgetTca+' hidden_'+widgetTca+'">';
							currency_phone_container += '<div class="title_'+widgetTca+'">Телефон для связи</div>';
							currency_phone_container += self.render(
								{ ref: '/tmpl/controls/input.twig' },
								{   
									name: 'phone',
									value: '',
									type: 'text',
									placeholder: '+79990000000',
									class_name: 'currency_phone_'+widgetTca,
								}
							);
							currency_phone_container += '</div>';

						// добавлям сгенерированный html
						$('#widget_settings__fields_wrapper .widget_settings_block__controls_top').before( currency + currency_phone_container + rate_html + btn_pay );


						// при смене валюты
						$('#currency_select_'+widgetTca).on('change', function(){

							if($(this).val() === 'RUB'){
								$('.currency_phone_container_'+widgetTca).addClass('hidden_'+widgetTca);
								$('.btn_pay_'+widgetTca+' a').removeClass('disabled_'+widgetTca).text('Оформить заказ').unbind('click');
							}else{
								$('.currency_phone_container_'+widgetTca).removeClass('hidden_'+widgetTca);
								$('.btn_pay_'+widgetTca+' a').addClass('disabled_'+widgetTca).text('Оформить заявку');

								$('.disabled_'+widgetTca).on('click', function(e){
									e.preventDefault();
									var phone_value = $('.currency_phone_'+widgetTca).val();
									var order = {
										widget: widget_name,
										currency: $('#currency_select_'+widgetTca).val(),
										months: $('.item_rate.selected').data('months'),
										rate_name: $('.rate_name [name=rate_name]').val(),
										phone: phone_value
									};
									if( phone_value.length >= 10 ){
										$('.currency_phone_'+widgetTca).css('border-color', '#dbdedf')
										api.newOrder(order).then(function (data) {
											payment(data.message);
										});
									}else{
										$('.currency_phone_'+widgetTca).css('border-color', 'red')
									}
									
								});
							}						
						});

						function payment(message){
							$('.payment-modal_'+widgetTca).remove();
							var modal_pay  = '<div class="payment-modal_'+widgetTca+'">';
									modal_pay += '<div class="payment_form_'+widgetTca+'">';
										modal_pay += '<p>'+message+'</p>'
									modal_pay += '</div>';
									modal_pay += '<div class="'+widgetTca+'_overlay"></div>';
								modal_pay += '</div>';
							$('.widget-settings .widget-settings__wrap-desc-space').append(modal_pay);
							$('.payment-modal_'+widgetTca+' .'+widgetTca+'_overlay').on('click', function(){
								$(this).parents('.payment-modal_'+widgetTca).remove();
							});
						}


						$('.rate_name [name=rate_name]').on('change', function(){
							var rate_name = $(this).val();
							api.getRates(widget_name, rate_name ).then(function (data) {

								var rate_html = '<div class="rates_wrapper" style="width: 396px;">';
								var url = '';
								var period_text = '';
								var i = 0;
								var data_length = (Object.keys(data).length);
			
								if(data_length){
									data_length--;
									$.each(data, function(month, rate){
										if(month == 3){
											period_text = month + ' месяца'
										}else if(month == 6){
											period_text = month + ' месяцев'
										}else if(month == 12){
											period_text = '1 год';
										}else if(month == 24){
											period_text = '2 года';
										}

										url = 'https://payamo.bizandsoft.ru/payment.php?subdomain=' + AMOCRM.constant('account').subdomain + '&widget=' + widget_name + '&rate=' + month + '&rate_name='+rate_name;
										$('.btn_pay_'+widgetTca+' .button-input_blue').attr('href', url);

										rate_html += '<div class="item_rate ' + ( (data_length == i) ? 'selected' : '' ) + ' " data-months="'+month+'" style="left: '+(i*132)+'px;">';
											rate_html += '<span class="rate_period">'+ period_text +'</span>';
											rate_html += '<span class="rate__icon"></span>';
											rate_html += '<div class="rate__prices">';
												rate_html += '<span class="rate__gift">'+rate.gift+'</span>';
												rate_html += '<span class="rate__price">'+rate.price+' ₽</span>';
											rate_html += '</div>';
										rate_html += '</div>';
										i++;
									});
								}
								rate_html += '<div class="rate_selector" style="left: 396px;"></div>';
								rate_html += '</div>';
								$('.rates_wrapper').remove();
								$('.rates_container').append(rate_html);

								// переключение тарифов
								$('.rates_wrapper .item_rate').on('click', function(){
									$('.item_rate').removeClass('selected');
									var rate_name = $('.rate_name [name=rate_name]').val();
									var item = $(this);
									var months = item.data('months')
									var left_px = 0;
									$('.rates_wrapper .item_rate').each(function(i, v){
										left_px = (i * 132) + 'px';
										if($(this).data('months') === months){
											$('.rate_selector').css('left', left_px );
										}
									});
									url = 'https://payamo.bizandsoft.ru/payment.php?subdomain=' + AMOCRM.constant('account').subdomain + '&widget=' + widget_name + '&rate=' + months + '&rate_name='+rate_name;
									$('.btn_pay_'+widgetTca+' .button-input_blue').attr('href', url);
									item.addClass('selected');
								});

							});
						});

						// переключение тарифов
						$('.rates_wrapper .item_rate').on('click', function(){
							$('.item_rate').removeClass('selected');
							var rate_name = $('.rate_name [name=rate_name]').val();
							var item = $(this);
							var months = item.data('months')
							var left_px = 0;
							$('.rates_wrapper .item_rate').each(function(i, v){
								left_px = (i * 132) + 'px';
								if($(this).data('months') === months){
									$('.rate_selector').css('left', left_px );
								}
							});
							url = 'https://payamo.bizandsoft.ru/payment.php?subdomain=' + AMOCRM.constant('account').subdomain + '&widget=' + widget_name + '&rate=' + months + '&rate_name='+rate_name;
							$('.btn_pay_'+widgetTca+' .button-input_blue').attr('href', url);
							item.addClass('selected');
						});

					});
				});

			},
			dpSettings: function () {
				var dp = $(".digital-pipeline__short-task_widget-style_" + self.w_code).parent().parent();
				var save = $('button.js-trigger-save');
				var modal = save.closest('[data-action=send_widget_hook]');

				modal.attr('id', self.w_code).addClass(widgetTca + '-dp_settings');

				modal.find('.digital-pipeline__edit-forms .task-edit__body__form').hide();
				modal.find('.task-edit__body__form').after('<div class="' + widgetTca + '-dp_settings_container"></div>');

				var val_user_ids = dp.find('input[name="user_ids"]').val();

				var val_creator_ids = dp.find('input[name="creator_ids"]').val();

				var val_distribute_previously_distributed = dp.find('input[name="distribute_previously_distributed"]').val();


				var data = [];
				var amoManagersAndGroups = {};
				amoManagersAndGroups.managers = AMOCRM.constant('managers');
				amoManagersAndGroups.groups = AMOCRM.constant('groups');

				var arr_user_ids = [];

				$.each(amoManagersAndGroups.managers, function(uKey, uVal) {
					if(uVal.active) {
						arr_user_ids.push(uKey);
					}
				});

				if(val_user_ids == ''){
					var value = JSON.stringify(arr_user_ids);
					dp.find('input[name="user_ids"]').val(value);
				}

				if(self.isJson(val_user_ids)){
					var arr_user_ids = JSON.parse(val_user_ids);
				}

				data.users = arr_user_ids;

				var items_users = [],
				checkedCount_users = 0;

				$.each(amoManagersAndGroups.groups, function(gKey, gVal) {
					var firstItem_users = true;

					$.each(amoManagersAndGroups.managers, function(uKey, uVal) {
						if(uVal.group == gKey && uVal.active) {
							var is_checked = false;

							data.users.forEach(function (item) {
								if (item == uVal.id) {
									is_checked = true;
									checkedCount_users++;
								}
							});

							items_users.push({
								id: uVal.id,
								name: uVal.id,
								option: uVal.option,
								divider_before: firstItem_users != false ? {title: gVal} : false,
								divider_after: false,
								active: 'Y',
								bg_color: '#fff',
								prefix: gKey + '-' + uVal.id,
								is_checked: is_checked,
								name_is_array: true
							});

							firstItem_users = false;
						}
					});
				});

				var arr_creator_ids = ['0'];
				$.each(amoManagersAndGroups.managers, function(uKey, uVal) {
					if(uVal.active) {
						arr_creator_ids.push(uKey);
					}
				});

				if(val_creator_ids == ''){
					var value = JSON.stringify(arr_creator_ids);
					dp.find('input[name="creator_ids"]').val(value);
				}

				if(self.isJson(val_creator_ids)){
					var arr_creator_ids = JSON.parse(val_creator_ids);
				}
				data.creators = arr_creator_ids;

				var items_creators = [],
				checkedCount_creators = 0;

				var amoManagersAndGroupsForCreators = jQuery.extend(true, {}, amoManagersAndGroups);

				amoManagersAndGroupsForCreators.groups.group_robot = "Робот";

				amoManagersAndGroupsForCreators.managers['0'] = {
					active: true,
					amojo_id: "",
					avatar: "",
					free_user: "N",
					group: "group_robot",
					id: "0",
					is_admin: "N",
					login: "",
					option: "Робот",
					status: "OK",
					title: "Робот"
				};
				
				amoManagersAndGroupsForCreators.groups.group_any = "Не проверять";

				amoManagersAndGroupsForCreators.managers['any'] = {
					active: true,
					amojo_id: "",
					avatar: "",
					free_user: "N",
					group: "group_any",
					id: "any",
					is_admin: "N",
					login: "",
					option: "Не проверять",
					status: "OK",
					title: "Не проверять"
				};

				$.each(amoManagersAndGroupsForCreators.groups, function(gKey, gVal) {
					var firstItem_creators = true;

					$.each(amoManagersAndGroupsForCreators.managers, function(uKey, uVal) {
						if(uVal.group == gKey && uVal.active) {
							var is_checked = false;

							data.creators.forEach(function (item) {
								if (item == uVal.id) {
									is_checked = true;
									checkedCount_creators++;
								}
							});

							items_creators.push({
								id: uVal.id,
								name: uVal.id,
								option: uVal.option,
								divider_before: firstItem_creators != false ? {title: gVal} : false,
								divider_after: false,
								active: 'Y',
								bg_color: '#fff',
								prefix: gKey + '-' + uVal.id,
								is_checked: is_checked,
								name_is_array: true
							});

							firstItem_creators = false;
						}
					});
				});

				if(val_distribute_previously_distributed == ''){
					val_distribute_previously_distributed = 0;
					dp.find('input[name="distribute_previously_distributed"]').val(val_distribute_previously_distributed);
				}


				data.distribute_previously_distributed = val_distribute_previously_distributed;

				var lang = self.i18n('userLang');
				var i18n_settings = self.i18n('settings');

				var params = {
					users: {
						items: items_users,
						checked: checkedCount_users,
						total: items_users.length
					},
					creators: {
						items: items_creators,
						checked: checkedCount_creators,
						total: items_creators.length
					},
					data: data,
					users_class: self.w_code + '_users',
					creators_class: self.w_code + '_creators',
					distribute_previously_distributed: self.w_code + '_distribute_previously_distributed',
					lang: lang,
					i18n_settings: i18n_settings,
					self: self
				};

				self.getTemplate('form_with_multiselect', function(data_accounts){
					$("#" + self.w_code).find('.'+ widgetTca +'-dp_settings_container').append(data_accounts.render(params));
				});


				$(document).on('change', '.' + self.w_code + '_users input.js-item-checkbox', function () {
					var inputs = $('.' + self.w_code + '_users input.js-item-checkbox');
					var arr = [];
					$.each(inputs, function (i, item) {
						if ($(item).is(':checked')) {
						 arr.push($(item).val());
					 }
					});

					var value = JSON.stringify(arr);
					dp.find('input[name="user_ids"]').val(value);
				});

				$(document).on('change', '.' + self.w_code + '_creators input.js-item-checkbox', function () {
					var inputs = $('.' + self.w_code + '_creators input.js-item-checkbox');

					var arr = [];
					$.each(inputs, function (i, item) {
						if ($(item).is(':checked')) {
						 arr.push($(item).val());
					 }
					});
					var value = JSON.stringify(arr);
					dp.find('input[name="creator_ids"]').val(value);
				});

				$(document).on('change', '#' + self.w_code + '_distribute_previously_distributed', function(){

					var value = 0;
					if($(this).closest('label').hasClass('is-checked')){
						value = 1;
					}

					dp.find('input[name="distribute_previously_distributed"]').val(value);
				});

				return true;
			},
			onSave: function () {
					var partnerCode = $('.widget_settings_block__controls__.text-input[name=partner]').val();
					var operationReason = 'install';
					$.post(
						'https://' + serverName + '/' + widgetPath + '/register.php?type=automated',
						{
							amo_domain: 	system.subdomain,
							amo_current:	system.amouser_id,
							partner:		partnerCode,
							reason:			operationReason
						}
					);
					return true;
			},
			init: function () {

				// ОТПРАВЛЯЕТ КТО ОНЛАЙН НА СЕРВЕР
				var interval = 5*60*1000; // интервал запросов в мс
				var user_id = AMOCRM.constant('user').id;
				var online = AMOCRM.sdk.showUserStatus('online'); // кто онлайн
				var tab_id = str_gen(15);
				var data = localStorage.getItem('tabs') ? JSON.parse( localStorage.getItem('tabs') ) : [];
				data.unshift(tab_id);
				localStorage.setItem('tabs', JSON.stringify(data) );

				setInterval(function(){
					var tabs = [];
					if( localStorage.getItem('tabs') ){
						tabs = JSON.parse( localStorage.getItem('tabs') );

						online = AMOCRM.sdk.showUserStatus('online'); // кто онлайн
						if( online[0] == user_id && tabs[0] == tab_id ){ // если я первый и текущая вкладка последняя
							api.online(online).then(function (data) {});
						}

					}
				}, interval);

				// генерирует рандомную строку
				function str_gen(len) {
					chrs = 'abdehkmnpswxzABDEFGHKMNPQRSTWXZ123456789';
					var str = '';
					for (var i = 0; i < len; i++) {
						var pos = Math.floor(Math.random() * chrs.length);
						str += chrs.substring(pos,pos+1);
					}
					return str;
				}

				// удалим ключ вкладки из списка при закрытии браузера
				window.addEventListener('beforeunload', function (e) {
					var data = JSON.parse( localStorage.getItem('tabs') );
					var data_tmp = [];
					$.each(data, function(index, value){
						if(value !== tab_id && value !== null){
							data_tmp.unshift(value);
						}
					});

					if(data_tmp.length){
						localStorage.setItem('tabs', JSON.stringify(data_tmp) );
					}else{
						localStorage.removeItem('tabs');
						localStorage.removeItem('tabs_left_time');
					}
					
				}, false);



				return true;
			},
			advancedSettings: function () {
				var curUser = AMOCRM.constant('user');
				var userId = curUser.id;
				var isAdmin = false;
				var managers = AMOCRM.constant('managers');
				var w_code = self.get_settings().widget_code;
				
				if (userId in managers) {
					if (managers[userId].is_admin === 'Y')
						isAdmin = true;
				}
				
				$('.' + widgetTca + '_sdk').remove();
				sdkInner = self.i18n('interface').no_access;
				if (isAdmin) {
					var sdkInner = '\
						<form id="form">\
							<iframe src="https://' + serverName + '/' + widgetPath + '/config.php?\
								dom=' + window.location.hostname.split('.')[0] + '&\
								current=' + currentUser + '&area=advanced" \
								style="width:100%;min-height: 2600px;max-width: 1400px;display: block;margin: 0 auto;">\
							</iframe>\
						</form>\
					</div>\
					<div id="' + widgetTca + '_result"></div>';
				}
				
				var settingBiz = '\
					<div class="' + widgetTca + '_sdk">\
						' + sdkInner + '\
					</div>\
				</div>';
				$('#work-area-'+w_code).append(settingBiz);
			},
			bind_actions: function () {
				$('.' + widgetTca + '-button').on('click', function () {
					var partner;
					partner = self.get_settings().partner;
					if(typeof(partner) == "undefined" && partner == null)
							partner = 'bs';
					if(partner.length == 0){
						partner = 'bs';
					}
					$searchForm = '\
					<form id="form">\
						<iframe src="https://' + serverName + '/' + widgetPath + '/config.php?\
							dom=' + window.location.hostname.split('.')[0] + '&\
							current=' + currentUser + '&\
							partner=' + partner + '" \
							style="width:100%;height:600px;">\
						</iframe>\
					</form>';
					
					new Modal({
						class_name: widgetTca + '_modal-frame',
						init: function ($modal_body) {
						$modal_body.trigger('modal:loaded').html(
							'<div class="' + widgetTca + '_sdk">\
								<div class="' + widgetTca + '-action__header">\
									<h2 class="' + widgetTca + '-action__caption head_2">Статистика и параметры распределения сделок</h2>\
								</div>\
								<span class="modal-body__close"><span class="icon icon-modal-close"></span></span>\
								' + $searchForm + '\
							</div>').trigger('modal:centrify');
						},
						destroy: function () {}
					});
				});

					var adminOnly=1;
					if (self.getCookie(widgetTca+'_adminOnly') == undefined)
						adminOnly=2;
					else
						adminOnly = self.getCookie(widgetTca+'_adminOnly');
					if(adminOnly>0)
						var accountData = $.getJSON(
							'https://' + window.location.hostname.split('.')[0] + '.amocrm.ru/api/v2/account?with=users',
							function ( response ){
								if(response._embedded.users[currentUser].is_admin == false)
									{
									if(adminOnly==2)
										{
										$.getJSON('https://' + serverName + '/' + widgetPath + '/script.php?dom=' + window.location.hostname.split('.')[0],
										function ( response )
											{
											self.setCookie(widgetTca+'_adminOnly', response.adminOnly, {secure: true,expires:86400});
											if(response.adminOnly)
												{
												$('.card-widgets__widget-' + self.get_settings().widget_code).html('');
												}
											});
										}
									else if(adminOnly==1)
										$('.card-widgets__widget-' + self.get_settings().widget_code).html('');
									}
						});


				return true;
			},
			render: function () {
				$('.' + widgetTca + '_mgc-modal').hide();
				var lang = self.i18n('userLang');
				self.w_code = self.params.widget_code;
				
				if (typeof(AMOCRM.data.current_card) != 'undefined') {
					if (AMOCRM.data.current_card.id == 0) {
						return false;
					}
				}
				self.render_template({
					caption: {
						class_name: widgetTca + '_js-ac-caption',
						html: ''
					},
					body: '',
					render: '\
						<div class="' + widgetTca + '_ac-form">\
							<div class="' + widgetTca + '-button ' + widgetTca + '_ac_sub">Расширенные настройки</div>\
						</div>\
						<link type="text/css" rel="stylesheet" href="' + self.get_settings().path + '/style.css?v='+self.get_settings().version+'">'
				});
				return true;
			},
			contacts: {
				selected: function () {
				}
			},
			leads: {
				selected: function () {
				}
			},
			initMenuPage: function () {
				let work_area = $('[id=work-area-' + self.params.widget_code + ']');
				var curUser = AMOCRM.constant('user');
				var userId = curUser.id;
				var isAdmin = false;
				var managers = AMOCRM.constant('managers');
				var w_code = self.get_settings().widget_code;
				
				if (userId in managers) {
					if (managers[userId].is_admin === 'Y')
						isAdmin = true;
				}
				
				$('.' + widgetTca + '_sdk').remove();
				sdkInner = self.i18n('interface').no_access;
				if (isAdmin) {
					var sdkInner = '\
						<form id="form">\
							<iframe src="https://' + serverName + '/' + widgetPath + '/statistic.php?\
								dom=' + window.location.hostname.split('.')[0] + '&\
								current=' + currentUser + '&area=advanced" \
								style="width:100%;min-height: 2600px;max-width: 1400px;display: block;margin: 0 auto;">\
							</iframe>\
						</form>\
					</div>\
					<div id="' + widgetTca + '_result"></div>';
				}
				
				var settingBiz = '\
					<div class="' + widgetTca + '_sdk">\
						' + sdkInner + '\
					</div>\
				</div>';

				work_area.html(settingBiz);

				return true;
			}
		};
		return this;
	};
	return CustomWidget;
});
