define(['jquery', 'lib/components/base/modal'], function($, Modal){
	var CustomWidget = function () {
		var self = this, system = self.system(), widgetTca = 'bizandsoft_leads', widgetPath = 'bs-leads', currentUser = $('.n-avatar').first().attr('id'), serverName = 'wdg.biz-crm.ru';

		self.widgetTca = widgetTca;
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
				var modal = $('.widget-settings__modal.' + self.params.widget_code);
				var save  = modal.find('button.js-widget-save');
				var installState = self.get_install_status();

				if (installState == 'install' || installState == 'not_configured'){
					modal.find('.widget_settings_block__controls').prepend('<div class="'+ widgetTca +'-section_warning"> Виджет не активирован! </div>');
					save.find('.button-input-inner__text').text('Активировать виджет');
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
					arr_user_ids.push(uKey);
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
						if(uVal.group == gKey) {
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
					arr_creator_ids.push(uKey);
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
						if(uVal.group == gKey) {
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
							<div class="' + widgetTca + '-button ' + widgetTca + '_ac_sub">Настройки распределения</div>\
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
