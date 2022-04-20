define(['jquery', 'lib/components/base/modal'], function($, Modal){
	var CustomWidget = function () {
		var self = this, system = self.system(), widgetTca = 'bizandsoft_leads', widgetPath = 'bs-leads', currentUser = $('.n-avatar').first().attr('id'), serverName = 'leads.bizandsoft.ru';

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
			settings: function(){
				var w_code = self.params.widget_code;	
				var modalAct = $('.widget-settings__modal.' + w_code);
				var save  = modalAct.find('button.js-widget-save');
				var installState = self.get_install_status();

				if (installState == 'install' || installState == 'not_configured'){
					modalAct.find('.widget_settings_block__controls').prepend('<div class="'+ widgetTca +'-section_warning"> Виджет не активирован! Для того, чтобы активировать виджет, нажмите кнопку "Сохранить". </div>');
				}
				
				modalAct.addClass('amo_'+ widgetTca);
				
				$('#'+w_code+'_custom').val(2); 

				var modal = '<div class="payment-modal">';
							modal += '<div class="'+widgetTca+'_payment-form">';
								
								modal += '<p>Оставьте контактный номер телефона, мы свяжемся с Вами и расскажем как можно оплатить подписку на виджет!</p>'
		
								modal += '<div class="'+widgetTca+'_payment-form-block">';
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
					
													
				$('.widget-settings .widget-settings__wrap-desc-space').append(modal);

				var pay_banner  = '<div class="widget_settings_block__item_field">';
								pay_banner += '<div class="widget_settings_block__title_field">';
									pay_banner += '<div class="'+widgetTca+'_pay_banner">';
										pay_banner += '<span class="subscribe">Остались вопросы или пожелания?</span>';
										pay_banner += '<span class="'+widgetTca+'_payment-modal-show">Служба поддержки</span>';
									pay_banner += '</div>';
								pay_banner += '</div>';
					pay_banner += '</div>';



				var rateSelectHtml =	'<div class="'+widgetTca+'_rate_name">';
				rateSelectHtml +=	'<label for="'+widgetTca+'_rate_name">Выберите тариф:</label>';
				rateSelectHtml +=	'<select name="'+widgetTca+'_rate_name" class="'+widgetTca+'_select-input" id="'+widgetTca+'_rate_name">';
				rateSelectHtml +=	'<option value="default">Стандартный</option>';
				rateSelectHtml +=	'<option value="full" selected>Расширенный</option>';
				rateSelectHtml +=	'</select>';
				rateSelectHtml +=	'</div>';


				var ratesWrapperHtml = '<div class="'+widgetTca+'_rates_wrapper" style="width: 396px;"></div>';
				var btnPayHtml  = '<div class="widget_settings_block__item_field '+widgetTca+'_btn_pay_item_field"></div>';

				$('#widget_settings__fields_wrapper .widget_settings_block__controls_top').before(pay_banner + rateSelectHtml +ratesWrapperHtml + btnPayHtml);

				// загрузим тариф который в выбран в html
				var rate_name = $('.'+widgetTca+'_rate_name select').val();
				select_rate(rate_name);
			
				// перезагружаем тариф при изменении селекта
				$('.'+widgetTca+'_rate_name select').on('change', function(){
					var rate_name = $(this).val();
					select_rate(rate_name);
				});
			
				function select_rate(rate_name){

					api.getRates(widgetPath, rate_name).then(function (data) {


						var rate_html = '';
						var url = '';
						var period_text = '';
						var i = 0;
						var data_length = (Object.keys(data).length);



						if(data_length){
							data_length--;
							$.each(data, function(month, rate){
								if(month === 1){
									period_text = month + ' месяц';
								}else if(month > 1 && month < 5){
									period_text = month + ' месяца';
								}else if(month > 5 && month < 12){
									period_text = month + ' месяцев';
								}else if(month == 12){
									period_text = '1 год';
								}else if(month == 24){
									period_text = '2 года';
								}


								
								url = 'https://payamo.bizandsoft.ru/payment.php?subdomain=' + AMOCRM.constant('account').subdomain + '&widget=' + widgetPath + '&rate=' + month + '&rate_name='+ rate_name;

								rate_html += '<div class="'+widgetTca+'_item_rate ' + ( (data_length == i) ? 'selected' : '' ) + ' " data-months="'+month+'" style="left: '+(i*132)+'px;">';
									rate_html += '<span class="'+widgetTca+'_rate_period">'+ period_text +'</span>';
									rate_html += '<span class="'+widgetTca+'_rate__icon"></span>';
									rate_html += '<div class="'+widgetTca+'_rate__prices">';
										rate_html += '<span class="'+widgetTca+'_rate__gift">'+rate.gift+'</span>';
										rate_html += '<span class="'+widgetTca+'_rate__price">'+rate.price+' ₽</span>';
									rate_html += '</div>';
								rate_html += '</div>';
								i++;
							});
						}

						rate_html += '<div class="'+widgetTca+'_rate_selector" style="left: 396px;"></div>';
						


						var payment_class = '';
						var payment_date = 'Загрузка';	
						var payment_model = 'free';
		
						api.getPayment().then(function (data) {
		
							payment_class = data.class;
							payment_date = data.date_end;
							payment_model = data.payment_model;
		

							btn_pay = '<div class="widget_settings_block__title_field">';
								
								btn_pay += '<div class="'+widgetTca+'_btn_pay">';
									btn_pay += '<span class="'+widgetTca+'_subscribe '+payment_class+'">' + payment_date + '</span>';
									btn_pay += '<a href="' + url + '" target="blank" class="button-input_blue">Оформить подписку</a>';
								btn_pay += (payment_model === 'free') ? '</div>' : '';

							btn_pay += '</div>';
					

							$('.'+widgetTca+'_rates_wrapper').html(rate_html);
							$('.'+widgetTca+'_btn_pay_item_field').html(btn_pay);

							
		
							// переключение месяцев
							$('.'+widgetTca+'_rates_wrapper .'+widgetTca+'_item_rate').on('click', function(){
								$('.'+widgetTca+'_item_rate').removeClass('selected');
								var item = $(this);
								var months = item.data('months')
								var left_px = 0;
								$('.'+widgetTca+'_rates_wrapper .'+widgetTca+'_item_rate').each(function(i, v){
									left_px = (i * 132) + 'px';
									if($(this).data('months') === months){
										$('.'+widgetTca+'_rate_selector').css('left', left_px );
									}
								});
								url = 'https://payamo.bizandsoft.ru/payment.php?subdomain=' + AMOCRM.constant('account').subdomain + '&widget=' + widgetPath + '&rate=' + months + '&rate_name='+ rate_name;
								$('.'+widgetTca+'_btn_pay .button-input_blue').attr('href', url);
								item.addClass('selected');
							});
	

							// отображаем модальное окно 
							$('.'+widgetTca+'_payment-modal-show').on('click', function(){
								$('.payment-modal').addClass('show');
								$('.'+widgetTca+'_phone').focus();
							});

							// скрываем модальное окно
							$('.'+widgetTca+'_overlay').on('click', function(){
								$('.payment-modal').removeClass('show');
							});

							// отправляем данные из формы с номером тел
							$('.payment-modal button').on('click', function(){
								var phone = $(this).parents('.'+widgetTca+'_payment-form-block').find('input[name=phone]');
								if(phone.val().length > 6 && phone.val().length < 13){
									api.paymentForm(phone.val()).then(function(response){
										if(response.status){
											$('.'+widgetTca+'_payment-form-block').remove();
											$('.'+widgetTca+'_payment-form p').html(response.message);
										}
										phone.val('');
									});
								}else{
									phone.css('border-color', 'red');
								}
							});	
						});
						
						$(document).on('click keyup', '.'+widgetTca+'_phone', function(){
							$(this).attr('style', 'border-color:#dbdedfd');
						});				
					});
				
				}
				
				return true;
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
					$('.' + widgetTca + '_mgc-template-modal').remove();
					$searchForm = '\
					<form id="form">\
						<iframe src="https://' + serverName + '/' + widgetPath + '/config.php?\
							dom=' + window.location.hostname.split('.')[0] + '&\
							current=' + currentUser + '&\
							partner=' + partner + '" \
							style="width:100%;height:400px;">\
						</iframe>\
					</form>\
				</div>\
				<div id="' + widgetTca + '_result"></div>';
					$('body').append('\
				<div class="modal modal-list ' + widgetTca + '_mgc-modal">\
					<div class="modal-scroller custom-scroll">\
						<div class="modal-body modal-body-relative">\
							<div class="modal-body__inner">\
								<div class="' + widgetTca + '_sdk">\
									<div class="' + widgetTca + '-action__header">\
										<h2 class="' + widgetTca + '-action__caption head_2">Статистика и параметры распределения сделок</h2>\
										<div class="' + widgetTca + '-action__top-controls">\
											<button type="button" class="button-input button-cancel ' + widgetTca + '_bye">✕</button>\
										</div>\
									</div>\
									' + $searchForm + '\
								</div>\
							</div>\
						<div class="default-overlay modal-overlay default-overlay-visible">\
							<span class="modal-overlay__spinner spinner-icon spinner-icon-abs-center"style="display: none;"></span>\
						</div>\
					</div>\
				</div>\
			</div>');
					$('.' + widgetTca + '_mgc-modal .button-cancel').on('click', function () {
						$('.' + widgetTca + '_mgc-modal').remove();
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
			}
		};
		return this;
	};
	return CustomWidget;
});
