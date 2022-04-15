window.massCreateLeads['init'].push(function (widget) {
  massCreateLeads.widget = widget;

  // Runs after the widget is installed
  // TODO: Удалить логи в production
  console.log('================ Mass Create Leads Active');

  massCreateLeads.run = async () => {
    // Получить id выбранных сделок
    massCreateLeads.selectedLeadsIDs = massCreateLeads.getSelectedLeadIDs();
    // console.log(selectedLeadsIDs);

    if (massCreateLeads.selectedLeadsIDs.length > 0) {
      // Получить и отфильтровать встроенную константу менеджеров
      massCreateLeads.users = await massCreateLeads.filterUsersConstant();

      // Получить воронки
      massCreateLeads.pipelines = await massCreateLeads.getPipelines();

      let leadsPerPage = parseInt(
        $('.control--select--input.js-pagination-rows-input').val()
      );

      if (leadsPerPage === massCreateLeads.selectedLeadsIDs.length) {
        // Show Mass Select Notification Prompt
        massCreateLeads.drawMassSelectNotification();
      } else {
        // Получить данные выбранных сделок
        massCreateLeads.selectedLeads = await massCreateLeads.getManyLeadsByIDs(
          massCreateLeads.selectedLeadsIDs
        );

        console.log(massCreateLeads.selectedLeads);

        // massCreateLeads.addFormModalAndItsEvents(
        //   users,
        //   pipelines,
        //   massCreateLeads.selectedLeads
        // );
        massCreateLeads.renderPopup(
          massCreateLeads.users,
          massCreateLeads.pipelines
        );
      }
    }
  };

  return true;
});
