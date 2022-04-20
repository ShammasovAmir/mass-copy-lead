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
      console.log('All Users');
      console.log(massCreateLeads.users);

      // Получить воронки
      massCreateLeads.pipelines = await massCreateLeads.getPipelines();
      console.log('Pipelines:');
      console.log(massCreateLeads.pipelines);

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
        console.log('Selected LEads:');
        console.log(massCreateLeads.selectedLeads);

        massCreateLeads.renderPopup(
          massCreateLeads.users,
          massCreateLeads.pipelines
        );
      }
    }
  };

  return true;
});
